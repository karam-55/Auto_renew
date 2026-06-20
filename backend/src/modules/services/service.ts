import prisma from '../../config/database';
import { CreateServiceInput, UpdateServiceInput, ServiceResponse } from './types';

export class ServiceService {
  async getAllServices(tenantId: string, includeInactive: boolean = false, skip?: number, limit?: number): Promise<ServiceResponse[]> {
    const services = await prisma.service.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    return services.map((service) => this.mapToServiceResponse(service));
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

    return services.map((service) => this.mapToServiceResponse(service));
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

    return services.map((service) => this.mapToServiceResponse(service));
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

    // Service price calculation:
    // If profitType = 'percentage': Price = (Direct Costs) × (1 + Profit Margin)
    // If profitType = 'fixed': Price = Direct Costs + Profit Amount
    const directCostSYP = (data.laborCostSYP ?? 0) + (data.materialCostSYP ?? 0);
    const directCostUSD = (data.laborCostUSD ?? 0) + (data.materialCostUSD ?? 0);

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

    const finalPriceSYP = data.priceSYP ?? (calculatedPriceSYP > 0 ? calculatedPriceSYP : 0);
    const finalPriceUSD = data.priceUSD ?? (calculatedPriceUSD > 0 ? calculatedPriceUSD : undefined);

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
        laborCostSYP: data.laborCostSYP,
        laborCostUSD: data.laborCostUSD,
        materialCostSYP: data.materialCostSYP,
        materialCostUSD: data.materialCostUSD,
        profitAmountSYP: computedProfitSYP,
        profitAmountUSD: computedProfitUSD,
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
      },
    });

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

    const categoryId = data.category !== undefined
      ? await this.resolveCategoryId(tenantId, data.category)
      : undefined;

    // IFRS-compliant price calculation for update
    let finalPriceSYP = data.priceSYP;
    let finalPriceUSD = data.priceUSD;
    let computedProfitSYP = Number(existingService.profitAmountSYP || 0);
    let computedProfitUSD = Number(existingService.profitAmountUSD || 0);

    const costsUpdated =
      data.laborCostSYP !== undefined ||
      data.materialCostSYP !== undefined ||
      data.laborCostUSD !== undefined ||
      data.materialCostUSD !== undefined ||
      data.profitMargin !== undefined ||
      data.profitAmountSYP !== undefined ||
      data.profitType !== undefined;

    if (costsUpdated) {
      const newLaborCostSYP = data.laborCostSYP ?? Number(existingService.laborCostSYP || 0);
      const newMaterialCostSYP = data.materialCostSYP ?? Number(existingService.materialCostSYP || 0);
      const newLaborCostUSD = data.laborCostUSD ?? Number(existingService.laborCostUSD || 0);
      const newMaterialCostUSD = data.materialCostUSD ?? Number(existingService.materialCostUSD || 0);

      const directCostSYP = newLaborCostSYP + newMaterialCostSYP;
      const directCostUSD = newLaborCostUSD + newMaterialCostUSD;

      const profitType = data.profitType || (existingService as any).profitType || 'percentage';

      if (profitType === 'fixed') {
        const profitAmountSYP = data.profitAmountSYP ?? Number((existingService as any).profitAmountSYP || 0);
        const profitAmountUSD = data.profitAmountUSD ?? Number((existingService as any).profitAmountUSD || 0);
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
        laborCostSYP: data.laborCostSYP,
        laborCostUSD: data.laborCostUSD,
        materialCostSYP: data.materialCostSYP,
        materialCostUSD: data.materialCostUSD,
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
      },
    });

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

  private mapToServiceResponse(service: any): ServiceResponse {
    return {
      id: service.id,
      tenantId: service.tenantId,
      name: service.name,
      nameAr: service.nameAr,
      nameEn: service.nameEn,
      description: service.description,
      category: service.category?.name || service.categoryId || null,
      duration: service.duration,
      basePrice: service.basePrice ? Number(service.basePrice) : null,
      laborCostSYP: service.laborCostSYP ? Number(service.laborCostSYP) : null,
      laborCostUSD: service.laborCostUSD ? Number(service.laborCostUSD) : null,
      materialCostSYP: service.materialCostSYP ? Number(service.materialCostSYP) : null,
      materialCostUSD: service.materialCostUSD ? Number(service.materialCostUSD) : null,
      profitAmountSYP: service.profitAmountSYP ? Number(service.profitAmountSYP) : null,
      profitAmountUSD: service.profitAmountUSD ? Number(service.profitAmountUSD) : null,
      profitType: (service as any).profitType || null,
      profitMargin: (service as any).profitMargin ? Number((service as any).profitMargin) : null,
      hasWarranty: service.hasWarranty,
      warrantyDescription: service.warrantyDescription,
      warrantyTerms: service.warrantyTerms,
      loyaltyPoints: service.loyaltyPoints,
      priceSYP: Number(service.priceSYP),
      priceUSD: service.priceUSD ? Number(service.priceUSD) : null,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
