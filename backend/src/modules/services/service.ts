import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { CreateServiceInput, UpdateServiceInput, ServiceResponse } from './types';

function fillCurrencyPair(syp: number, usd: number, exchangeRate: number): { syp: number; usd: number } {
  if (usd > 0) syp = Math.round(usd * exchangeRate);
  else if (syp > 0) usd = Math.round((syp / exchangeRate) * 100) / 100;
  return { syp, usd };
}

export class ServiceService {
  async getAllServices(tenantId: string, includeInactive: boolean = false, skip?: number, limit?: number): Promise<ServiceResponse[]> {
    const services = await prisma.service.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
      // limit === 0 means "all rows" → pass undefined to Prisma (no take).
      // limit > 0 → apply take (and skip for pagination).
      skip: limit === 0 ? undefined : (skip || undefined),
      take: limit === 0 ? undefined : (limit || undefined),
    });

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return Promise.all(services.map((service) => this.mapToServiceResponse(service, exchangeRate)));
  }

  async getServicesCount(tenantId: string, includeInactive: boolean = false): Promise<number> {
    return prisma.service.count({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
    });
  }

  async getServiceById(tenantId: string, serviceId: string): Promise<ServiceResponse | null> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: {
        serviceParts: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!service) {
      return null;
    }

    return this.mapToServiceResponse(service);
  }

  async getServicesByCategory(tenantId: string, category: string): Promise<ServiceResponse[]> {
    // Resolve category name to categoryId
    const categoryId = await this.resolveCategoryId(tenantId, category);
    const services = await prisma.service.findMany({
      where: {
        tenantId,
        categoryId: categoryId || undefined,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return Promise.all(services.map((service) => this.mapToServiceResponse(service, exchangeRate)));
  }

  async searchServices(tenantId: string, query: string): Promise<ServiceResponse[]> {
    const services = await prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return Promise.all(services.map((service) => this.mapToServiceResponse(service, exchangeRate)));
  }

  private async resolveCategoryId(tenantId: string, categoryName?: string): Promise<string | undefined> {
    if (!categoryName || categoryName.trim() === '') {
      return undefined;
    }
    const trimmed = categoryName.trim();
    // Try to find existing category by name
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        tenantId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    if (existing) {
      return existing.id;
    }
    // Create new category if not found
    const newCategory = await prisma.serviceCategory.create({
      data: {
        tenantId,
        name: trimmed,
        nameAr: trimmed,
        description: `Created from service creation`,
      },
    });
    return newCategory.id;
  }

  async createService(tenantId: string, data: CreateServiceInput): Promise<ServiceResponse> {
    const categoryId = await this.resolveCategoryId(tenantId, data.category);
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);

    // Auto-calculate laborCost if departmentId is provided
    let laborCostSYP = data.laborCostSYP ?? 0;
    let laborCostUSD = data.laborCostUSD ?? 0;
    if (data.departmentId && data.estimatedDurationMinutes) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, tenantId },
      });
      if (department) {
        const dept = department as any;
        if (dept.hasFixedSalary && dept.calculatedHourlyRateSYP) {
          laborCostSYP = Number(dept.calculatedHourlyRateSYP) * (data.estimatedDurationMinutes / 60);
        } else if (data.assignedEmployeeId) {
          const employee = await prisma.employee.findFirst({
            where: { id: data.assignedEmployeeId, tenantId },
          });
          if (employee && (employee as any).hourlyRate) {
            laborCostSYP = Number((employee as any).hourlyRate) * (data.estimatedDurationMinutes / 60);
          }
        }
      }
    }
    ({ syp: laborCostSYP, usd: laborCostUSD } = fillCurrencyPair(laborCostSYP, laborCostUSD, exchangeRate));

    // Service price calculation:
    // If profitType = 'percentage': Price = (Direct Costs) × (1 + Profit Margin)
    // If profitType = 'fixed': Price = Direct Costs + Profit Amount
    const directCostSYP = laborCostSYP + (data.materialCostSYP ?? 0);
    const directCostUSD = laborCostUSD + (data.materialCostUSD ?? 0);

    let calculatedPriceSYP = 0;
    let calculatedPriceUSD = 0;
    let computedProfitSYP = 0;
    let computedProfitUSD = 0;

    if (data.profitType === 'fixed' && (data.profitAmountSYP !== undefined || data.profitAmountUSD !== undefined)) {
      // Fixed profit amount
      calculatedPriceSYP = directCostSYP + (data.profitAmountSYP ?? 0);
      calculatedPriceUSD = directCostUSD + (data.profitAmountUSD ?? 0);
      computedProfitSYP = data.profitAmountSYP ?? 0;
      computedProfitUSD = data.profitAmountUSD ?? 0;
    } else {
      // Percentage profit margin (default)
      const profitMargin = (data.profitMargin ?? 25) / 100;
      calculatedPriceSYP = directCostSYP * (1 + profitMargin);
      calculatedPriceUSD = directCostUSD * (1 + profitMargin);
      computedProfitSYP = calculatedPriceSYP - directCostSYP;
      computedProfitUSD = calculatedPriceUSD - directCostUSD;
    }

    // Calculate material cost from parts if provided
    let materialCostSYP = data.materialCostSYP ?? 0;
    let materialCostUSD = data.materialCostUSD ?? 0;
    if (data.parts && data.parts.length > 0) {
      const partIds = data.parts.map(p => p.partId);
      const partsData = await prisma.part.findMany({
        where: { id: { in: partIds }, tenantId },
      });
      const partMap = new Map(partsData.map(p => [p.id, p]));
      materialCostSYP = data.parts.reduce((sum, p) => {
        const part = partMap.get(p.partId);
        return sum + (p.quantity * Number((part as any)?.costSYP ?? 0));
      }, 0);
      materialCostUSD = data.parts.reduce((sum, p) => {
        const part = partMap.get(p.partId) as any;
        const costUSD = part?.costUSD != null ? Number(part.costUSD) : Number(part?.costSYP || 0) / exchangeRate;
        return sum + (p.quantity * costUSD);
      }, 0);
    } else {
      ({ syp: materialCostSYP, usd: materialCostUSD } = fillCurrencyPair(materialCostSYP, materialCostUSD, exchangeRate));
    }

    // Recalculate with updated material cost
    const finalDirectCostSYP = laborCostSYP + materialCostSYP;
    const finalDirectCostUSD = laborCostUSD + materialCostUSD;

    const profitPair = fillCurrencyPair(data.profitAmountSYP ?? 0, data.profitAmountUSD ?? 0, exchangeRate);
    let finalCalculatedPriceSYP = 0;
    let finalCalculatedPriceUSD = 0;
    let finalComputedProfitSYP = 0;
    let finalComputedProfitUSD = 0;

    if (data.profitType === 'fixed') {
      finalCalculatedPriceSYP = finalDirectCostSYP + profitPair.syp;
      finalCalculatedPriceUSD = finalDirectCostUSD + profitPair.usd;
      finalComputedProfitSYP = profitPair.syp;
      finalComputedProfitUSD = profitPair.usd;
    } else {
      const profitMargin = (data.profitMargin ?? 25) / 100;
      finalCalculatedPriceSYP = finalDirectCostSYP * (1 + profitMargin);
      finalCalculatedPriceUSD = finalDirectCostUSD * (1 + profitMargin);
      finalComputedProfitSYP = finalCalculatedPriceSYP - finalDirectCostSYP;
      finalComputedProfitUSD = finalCalculatedPriceUSD - finalDirectCostUSD;
    }

    let finalPriceSYP = data.priceSYP ?? (finalCalculatedPriceSYP > 0 ? finalCalculatedPriceSYP : 0);
    let finalPriceUSD = data.priceUSD ?? (finalCalculatedPriceUSD > 0 ? finalCalculatedPriceUSD : 0);
    if (data.priceUSD != null && data.priceUSD > 0) {
      finalPriceUSD = data.priceUSD;
      finalPriceSYP = Math.round(data.priceUSD * exchangeRate);
    } else if (data.priceSYP != null && data.priceSYP > 0) {
      finalPriceSYP = data.priceSYP;
      finalPriceUSD = Math.round((data.priceSYP / exchangeRate) * 100) / 100;
    }

    const service = await prisma.service.create({
      data: {
        tenantId,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        categoryId,
        duration: data.duration,
        basePrice: data.basePrice,
        laborCostSYP: laborCostSYP,
        laborCostUSD: laborCostUSD,
        materialCostSYP: materialCostSYP,
        materialCostUSD: materialCostUSD,
        profitAmountSYP: finalComputedProfitSYP,
        profitAmountUSD: finalComputedProfitUSD,
        profitType: data.profitType ?? 'percentage',
        profitMargin: data.profitType === 'percentage' ? (data.profitMargin ?? 25) : null,
        hasWarranty: data.hasWarranty ?? false,
        warrantyDescription: data.warrantyDescription,
        warrantyTerms: data.warrantyTerms,
        loyaltyPoints: data.loyaltyPoints,
        priceSYP: finalPriceSYP,
        priceUSD: finalPriceUSD,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        isActive: data.isActive ?? true,
        ...(data.departmentId ? { departmentId: data.departmentId } : {}),
        ...(data.assignedEmployeeId ? { assignedEmployeeId: data.assignedEmployeeId } : {}),
      },
    });

    // Create ServicePart records if parts provided
    if (data.parts && data.parts.length > 0) {
      await prisma.servicePart.createMany({
        data: data.parts.map(p => ({
          serviceId: service.id,
          partId: p.partId,
          quantity: p.quantity,
        })),
      });
    }

    return this.mapToServiceResponse(service);
  }

  async updateService(tenantId: string, serviceId: string, data: UpdateServiceInput): Promise<ServiceResponse> {
    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!existingService) {
      throw new Error('Service not found');
    }

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const categoryId = data.category !== undefined
      ? await this.resolveCategoryId(tenantId, data.category)
      : undefined;

    // IFRS-compliant price calculation for update
    let finalPriceSYP = data.priceSYP;
    let finalPriceUSD = data.priceUSD;
    let computedProfitSYP = Number(existingService.profitAmountSYP || 0);
    let computedProfitUSD = Number(existingService.profitAmountUSD || 0);

    // Auto-calculate laborCost if departmentId changed or estimatedDurationMinutes changed
    let laborCostSYP = data.laborCostSYP ?? Number(existingService.laborCostSYP || 0);
    let laborCostUSD = data.laborCostUSD ?? Number(existingService.laborCostUSD || 0);
    if ((data.departmentId || data.estimatedDurationMinutes) && data.departmentId !== '') {
      const deptId = data.departmentId ?? (existingService as any).departmentId;
      const durationMin = data.estimatedDurationMinutes ?? existingService.estimatedDurationMinutes;
      if (deptId && durationMin) {
        const department = await prisma.department.findFirst({
          where: { id: deptId, tenantId },
        });
        if (department) {
          const dept = department as any;
          if (dept.hasFixedSalary && dept.calculatedHourlyRateSYP) {
            laborCostSYP = Number(dept.calculatedHourlyRateSYP) * (durationMin / 60);
          } else if (data.assignedEmployeeId || (existingService as any).assignedEmployeeId) {
            const empId = data.assignedEmployeeId ?? (existingService as any).assignedEmployeeId;
            const employee = await prisma.employee.findFirst({
              where: { id: empId, tenantId },
            });
            if (employee && (employee as any).hourlyRate) {
              laborCostSYP = Number((employee as any).hourlyRate) * (durationMin / 60);
            }
          }
        }
      }
    }

    ({ syp: laborCostSYP, usd: laborCostUSD } = fillCurrencyPair(laborCostSYP, laborCostUSD, exchangeRate));

    // Calculate material cost from parts if provided
    let materialCostSYP = data.materialCostSYP ?? Number(existingService.materialCostSYP || 0);
    let materialCostUSD = data.materialCostUSD ?? Number(existingService.materialCostUSD || 0);
    if (data.parts && data.parts.length > 0) {
      const partIds = data.parts.map(p => p.partId);
      const partsData = await prisma.part.findMany({
        where: { id: { in: partIds }, tenantId },
      });
      const partMap = new Map(partsData.map(p => [p.id, p]));
      materialCostSYP = data.parts.reduce((sum, p) => {
        const part = partMap.get(p.partId);
        return sum + (p.quantity * Number((part as any)?.costSYP ?? 0));
      }, 0);
      materialCostUSD = data.parts.reduce((sum, p) => {
        const part = partMap.get(p.partId) as any;
        const costUSD = part?.costUSD != null ? Number(part.costUSD) : Number(part?.costSYP || 0) / exchangeRate;
        return sum + (p.quantity * costUSD);
      }, 0);
    } else {
      ({ syp: materialCostSYP, usd: materialCostUSD } = fillCurrencyPair(materialCostSYP, materialCostUSD, exchangeRate));
    }

    const costsUpdated =
      data.laborCostSYP !== undefined ||
      data.materialCostSYP !== undefined ||
      data.laborCostUSD !== undefined ||
      data.materialCostUSD !== undefined ||
      data.profitMargin !== undefined ||
      data.profitAmountSYP !== undefined ||
      data.profitType !== undefined ||
      data.departmentId !== undefined ||
      data.estimatedDurationMinutes !== undefined ||
      data.parts !== undefined;

    if (costsUpdated) {
      const newLaborCostSYP = laborCostSYP;
      const newMaterialCostSYP = materialCostSYP;
      const newLaborCostUSD = laborCostUSD;
      const newMaterialCostUSD = materialCostUSD;

      const directCostSYP = newLaborCostSYP + newMaterialCostSYP;
      const directCostUSD = newLaborCostUSD + newMaterialCostUSD;

      const profitType = data.profitType || (existingService as any).profitType || 'percentage';
      const profitPair = fillCurrencyPair(
        Number(data.profitAmountSYP ?? (existingService as any).profitAmountSYP ?? 0),
        Number(data.profitAmountUSD ?? (existingService as any).profitAmountUSD ?? 0),
        exchangeRate
      );

      if (profitType === 'fixed') {
        const profitAmountSYP = profitPair.syp;
        const profitAmountUSD = profitPair.usd;
        const calculatedPriceSYP = directCostSYP + profitAmountSYP;
        const calculatedPriceUSD = directCostUSD + profitAmountUSD;
        computedProfitSYP = profitAmountSYP;
        computedProfitUSD = profitAmountUSD;
        if (data.priceSYP === undefined) {
          finalPriceSYP = calculatedPriceSYP > 0 ? calculatedPriceSYP : Number(existingService.priceSYP);
        }
        if (data.priceUSD === undefined) {
          finalPriceUSD = calculatedPriceUSD > 0 ? calculatedPriceUSD : Number(existingService.priceUSD || 0);
        }
      } else {
        const profitMargin = (data.profitMargin ?? Number((existingService as any).profitMargin || 25)) / 100;
        const calculatedPriceSYP = directCostSYP * (1 + profitMargin);
        const calculatedPriceUSD = directCostUSD * (1 + profitMargin);
        computedProfitSYP = calculatedPriceSYP - directCostSYP;
        computedProfitUSD = calculatedPriceUSD - directCostUSD;
        if (data.priceSYP === undefined) {
          finalPriceSYP = calculatedPriceSYP > 0 ? calculatedPriceSYP : Number(existingService.priceSYP);
        }
        if (data.priceUSD === undefined) {
          finalPriceUSD = calculatedPriceUSD > 0 ? calculatedPriceUSD : Number(existingService.priceUSD || 0);
        }
      }
    }

    if (data.priceUSD != null && data.priceUSD > 0) {
      finalPriceSYP = Math.round(data.priceUSD * exchangeRate);
      finalPriceUSD = data.priceUSD;
    } else if (data.priceSYP != null && data.priceSYP > 0) {
      finalPriceSYP = data.priceSYP;
      finalPriceUSD = Math.round((data.priceSYP / exchangeRate) * 100) / 100;
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        ...(categoryId !== undefined ? { categoryId } : {}),
        duration: data.duration,
        basePrice: data.basePrice,
        laborCostSYP: laborCostSYP,
        laborCostUSD: laborCostUSD,
        materialCostSYP: materialCostSYP,
        materialCostUSD: materialCostUSD,
        profitAmountSYP: computedProfitSYP,
        profitAmountUSD: computedProfitUSD,
        ...(data.profitType !== undefined ? { profitType: data.profitType } : {}),
        ...(data.profitMargin !== undefined ? { profitMargin: data.profitType === 'percentage' ? data.profitMargin : null } : {}),
        hasWarranty: data.hasWarranty,
        warrantyDescription: data.warrantyDescription,
        warrantyTerms: data.warrantyTerms,
        loyaltyPoints: data.loyaltyPoints,
        priceSYP: finalPriceSYP,
        priceUSD: finalPriceUSD,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        isActive: data.isActive,
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.assignedEmployeeId !== undefined ? { assignedEmployeeId: data.assignedEmployeeId } : {}),
      },
    });

    // Update ServicePart records if parts provided
    if (data.parts && data.parts.length > 0) {
      // Delete existing service parts
      await prisma.servicePart.deleteMany({
        where: { serviceId },
      });
      // Create new service parts
      await prisma.servicePart.createMany({
        data: data.parts.map(p => ({
          serviceId,
          partId: p.partId,
          quantity: p.quantity,
        })),
      });
    }

    return this.mapToServiceResponse(service);
  }

  async deleteService(tenantId: string, serviceId: string): Promise<void> {
    // Check if service exists and belongs to tenant
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!existingService) {
      throw new Error('Service not found');
    }

    // Check if service is used in any bookings
    const bookingServicesCount = await prisma.bookingService.count({
      where: { serviceId },
    });

    if (bookingServicesCount > 0) {
      throw new Error('Cannot delete service that is used in bookings');
    }

    // Check if service is used in any invoices
    const invoiceItemsCount = await prisma.invoiceItem.count({
      where: { serviceId },
    });

    if (invoiceItemsCount > 0) {
      throw new Error('Cannot delete service that is used in invoices');
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });
  }

  // Service Parts CRUD
  async getServiceParts(tenantId: string, serviceId: string): Promise<any[]> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: {
        serviceParts: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    return service.serviceParts.map((sp: any) => ({
      id: sp.id,
      serviceId: sp.serviceId,
      partId: sp.partId,
      quantity: sp.quantity,
      part: sp.part,
    }));
  }

  async addServicePart(tenantId: string, serviceId: string, partId: string, quantity: number): Promise<any> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const part = await prisma.part.findFirst({
      where: { id: partId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    const servicePart = await prisma.servicePart.upsert({
      where: {
        serviceId_partId: {
          serviceId,
          partId,
        },
      },
      update: {
        quantity,
      },
      create: {
        serviceId,
        partId,
        quantity,
      },
      include: {
        part: true,
      },
    });

    return {
      id: servicePart.id,
      serviceId: servicePart.serviceId,
      partId: servicePart.partId,
      quantity: servicePart.quantity,
      part: servicePart.part,
    };
  }

  async removeServicePart(tenantId: string, serviceId: string, partId: string): Promise<void> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    await prisma.servicePart.deleteMany({
      where: {
        serviceId,
        partId,
      },
    });
  }

  private async mapToServiceResponse(service: any, exchangeRate?: number): Promise<ServiceResponse> {
    const rate = exchangeRate ?? Number((await settingsService.getSettings(service.tenantId)).exchangeRate);
    const moneySYP = (storedSYP: any, storedUSD: any): number | null => {
      if (storedUSD != null && rate > 0) return Math.round(Number(storedUSD) * rate);
      return storedSYP == null ? null : Number(storedSYP);
    };
    const priceUSD = service.priceUSD == null ? null : Number(service.priceUSD);
    const priceSYP = moneySYP(service.priceSYP, service.priceUSD) ?? 0;
    const parts = (service.serviceParts || []).map((sp: any) => {
      const unitCostUSD = sp.part?.costUSD == null ? null : Number(sp.part.costUSD);
      const unitCostSYP = moneySYP(sp.part?.costSYP, sp.part?.costUSD) ?? 0;
      return {
        id: sp.id,
        partId: sp.partId,
        partName: sp.part?.name || sp.part?.nameAr || 'غير مسمى',
        quantity: sp.quantity,
        unitCostSYP,
        unitCostUSD,
        totalCostSYP: sp.quantity * unitCostSYP,
        totalCostUSD: unitCostUSD == null ? null : Math.round(sp.quantity * unitCostUSD * 100) / 100,
      };
    });

    return {
      id: service.id,
      tenantId: service.tenantId,
      name: service.name,
      nameAr: service.nameAr,
      nameEn: service.nameEn,
      description: service.description,
      category: service.category?.name || service.categoryId || null,
      duration: service.duration,
      basePrice: priceUSD != null && rate > 0 ? priceSYP : service.basePrice == null ? null : Number(service.basePrice),
      laborCostSYP: moneySYP(service.laborCostSYP, service.laborCostUSD),
      laborCostUSD: service.laborCostUSD == null ? null : Number(service.laborCostUSD),
      materialCostSYP: moneySYP(service.materialCostSYP, service.materialCostUSD),
      materialCostUSD: service.materialCostUSD == null ? null : Number(service.materialCostUSD),
      profitAmountSYP: moneySYP(service.profitAmountSYP, service.profitAmountUSD),
      profitAmountUSD: service.profitAmountUSD == null ? null : Number(service.profitAmountUSD),
      profitType: service.profitType || null,
      profitMargin: service.profitMargin == null ? null : Number(service.profitMargin),
      hasWarranty: service.hasWarranty,
      warrantyDescription: service.warrantyDescription,
      warrantyTerms: service.warrantyTerms,
      loyaltyPoints: service.loyaltyPoints,
      priceSYP,
      priceUSD,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      isActive: service.isActive,
      departmentId: service.departmentId || null,
      assignedEmployeeId: service.assignedEmployeeId || null,
      parts,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
