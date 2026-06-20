import prisma from '../../config/database';
import {
  CreateCostCenterInput,
  UpdateCostCenterInput,
  CreateCostCenterAllocationInput,
  UpdateCostCenterAllocationInput,
  CostCenterResponse,
  CostCenterAllocationResponse,
  OverheadRateResponse,
  ServiceCostBreakdownResponse,
  CostDetailItem,
} from './types';

const DEFAULT_CENTERS = [
  { name: 'ورشة ميكانيك', nameAr: 'ورشة ميكانيك', type: 'WORKSHOP', costDriver: 'LABOR_HOURS', driverQuantity: 600, monthlyBudget: 500000 },
  { name: 'مستودع مواد', nameAr: 'مستودع مواد', type: 'WAREHOUSE', costDriver: 'MATERIAL_MOVES', driverQuantity: 500, monthlyBudget: 200000 },
  { name: 'غسيل سيارات', nameAr: 'غسيل سيارات', type: 'CAR_WASH', costDriver: 'SERVICE_COUNT', driverQuantity: 300, monthlyBudget: 100000 },
  { name: 'استقبال وكاشير', nameAr: 'استقبال وكاشير', type: 'RECEPTION', costDriver: 'INVOICE_COUNT', driverQuantity: 200, monthlyBudget: 150000 },
  { name: 'إدارة', nameAr: 'إدارة', type: 'ADMIN', costDriver: 'FIXED', driverQuantity: 1, monthlyBudget: 300000 },
  { name: 'خدمات مشتركة', nameAr: 'خدمات مشتركة', type: 'SHARED', costDriver: 'REVENUE_ALLOCATION', driverQuantity: 1, monthlyBudget: 200000 },
];

const DEFAULT_ALLOCATIONS = [
  { from: 'خدمات مشتركة', to: 'ورشة ميكانيك', percent: 50 },
  { from: 'خدمات مشتركة', to: 'مستودع مواد', percent: 20 },
  { from: 'خدمات مشتركة', to: 'غسيل سيارات', percent: 15 },
  { from: 'خدمات مشتركة', to: 'استقبال وكاشير', percent: 15 },
];

export class CostCenterService {
  // ─── Initialize default cost centers for a tenant ───
  async initializeDefaults(tenantId: string): Promise<CostCenterResponse[]> {
    const existing = await prisma.costCenter.findMany({ where: { tenantId } });
    if (existing.length > 0) return existing.map(this.mapCostCenter);

    const created = await prisma.$transaction(async (tx) => {
      const centers: Record<string, string> = {};
      const results = [];

      for (const def of DEFAULT_CENTERS) {
        const center = await tx.costCenter.create({
          data: { ...def, tenantId, isDefault: true } as any,
        });
        centers[def.name] = center.id;
        results.push(center);
      }

      for (const alloc of DEFAULT_ALLOCATIONS) {
        const fromId = centers[alloc.from];
        const toId = centers[alloc.to];
        if (fromId && toId) {
          await tx.costCenterAllocation.create({
            data: {
              tenantId,
              fromCenterId: fromId,
              toCenterId: toId,
              allocationPercent: alloc.percent,
            },
          });
        }
      }

      return results;
    });

    return created.map(this.mapCostCenter);
  }

  // ─── CRUD Cost Centers ───
  async getAll(tenantId: string): Promise<CostCenterResponse[]> {
    const centers = await prisma.costCenter.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return centers.map(this.mapCostCenter);
  }

  async getById(tenantId: string, id: string): Promise<CostCenterResponse | null> {
    const center = await prisma.costCenter.findFirst({
      where: { id, tenantId },
    });
    return center ? this.mapCostCenter(center) : null;
  }

  async create(tenantId: string, input: CreateCostCenterInput): Promise<CostCenterResponse> {
    const center = await prisma.costCenter.create({
      data: {
        tenantId,
        name: input.name,
        nameAr: input.nameAr || input.name,
        type: input.type as any,
        costDriver: input.costDriver as any,
        driverQuantity: input.driverQuantity ?? 1,
        monthlyBudget: input.monthlyBudget ?? 0,
        actualCost: input.actualCost ?? null,
        isActive: input.isActive ?? true,
        isDefault: false,
      },
    });
    return this.mapCostCenter(center);
  }

  async update(tenantId: string, id: string, input: UpdateCostCenterInput): Promise<CostCenterResponse | null> {
    const center = await prisma.costCenter.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.nameAr && { nameAr: input.nameAr }),
        ...(input.type && { type: input.type as any }),
        ...(input.costDriver && { costDriver: input.costDriver as any }),
        ...(input.driverQuantity !== undefined && { driverQuantity: input.driverQuantity }),
        ...(input.monthlyBudget !== undefined && { monthlyBudget: input.monthlyBudget }),
        ...(input.actualCost !== undefined && { actualCost: input.actualCost }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    if (center.count === 0) return null;
    return this.getById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await prisma.costCenter.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  // ─── Cost Center Allocations ───
  async getAllocations(tenantId: string): Promise<CostCenterAllocationResponse[]> {
    const allocs = await prisma.costCenterAllocation.findMany({
      where: { tenantId, isActive: true },
      include: { fromCenter: true, toCenter: true },
      orderBy: { createdAt: 'desc' },
    });
    return allocs.map((a: any) => ({
      id: a.id,
      tenantId: a.tenantId,
      fromCenterId: a.fromCenterId,
      toCenterId: a.toCenterId,
      fromCenterName: a.fromCenter?.name,
      toCenterName: a.toCenter?.name,
      allocationPercent: Number(a.allocationPercent),
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  async createAllocation(tenantId: string, input: CreateCostCenterAllocationInput): Promise<CostCenterAllocationResponse> {
    const alloc = await prisma.costCenterAllocation.create({
      data: {
        tenantId,
        fromCenterId: input.fromCenterId,
        toCenterId: input.toCenterId,
        allocationPercent: input.allocationPercent,
      },
      include: { fromCenter: true, toCenter: true },
    });
    return {
      id: alloc.id,
      tenantId: alloc.tenantId,
      fromCenterId: alloc.fromCenterId,
      toCenterId: alloc.toCenterId,
      fromCenterName: (alloc as any).fromCenter?.name,
      toCenterName: (alloc as any).toCenter?.name,
      allocationPercent: Number(alloc.allocationPercent),
      isActive: alloc.isActive,
      createdAt: alloc.createdAt,
      updatedAt: alloc.updatedAt,
    };
  }

  async updateAllocation(tenantId: string, id: string, input: UpdateCostCenterAllocationInput): Promise<CostCenterAllocationResponse | null> {
    const alloc = await prisma.costCenterAllocation.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.allocationPercent !== undefined && { allocationPercent: input.allocationPercent }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    if (alloc.count === 0) return null;
    const updated = await prisma.costCenterAllocation.findFirst({
      where: { id, tenantId },
      include: { fromCenter: true, toCenter: true },
    });
    if (!updated) return null;
    return {
      id: updated.id,
      tenantId: updated.tenantId,
      fromCenterId: updated.fromCenterId,
      toCenterId: updated.toCenterId,
      fromCenterName: (updated as any).fromCenter?.name,
      toCenterName: (updated as any).toCenter?.name,
      allocationPercent: Number(updated.allocationPercent),
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteAllocation(tenantId: string, id: string): Promise<boolean> {
    const result = await prisma.costCenterAllocation.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  // ─── Overhead Rate Calculation ───
  async calculateOverheadRates(tenantId: string): Promise<OverheadRateResponse[]> {
    const centers = await prisma.costCenter.findMany({
      where: { tenantId, isActive: true },
      include: {
        allocationsTo: { where: { isActive: true }, include: { fromCenter: true } },
      },
    });

    const sharedAllocations: Record<string, number> = {};

    // First pass: calculate allocated amounts from shared centers
    for (const center of centers) {
      let allocated = 0;
      for (const alloc of (center as any).allocationsTo || []) {
        const fromBudget = Number(alloc.fromCenter.monthlyBudget || 0);
        allocated += fromBudget * (Number(alloc.allocationPercent) / 100);
      }
      sharedAllocations[center.id] = allocated;
    }

    // Second pass: build rate responses
    const results: OverheadRateResponse[] = [];
    for (const center of centers) {
      const budget = Number(center.monthlyBudget || 0);
      const allocated = sharedAllocations[center.id] || 0;
      const totalBudget = budget + allocated;
      const driverQty = center.driverQuantity || 1;
      const rate = totalBudget / driverQty;

      let rateUnit = 'ل.س';
      if (center.costDriver === 'LABOR_HOURS') rateUnit = 'ل.س/ساعة';
      else if (center.costDriver === 'MATERIAL_MOVES') rateUnit = 'ل.س/حركة';
      else if (center.costDriver === 'SERVICE_COUNT') rateUnit = 'ل.س/خدمة';
      else if (center.costDriver === 'INVOICE_COUNT') rateUnit = 'ل.س/فاتورة';
      else if (center.costDriver === 'FIXED') rateUnit = 'ل.س/شهر';

      results.push({
        costCenterId: center.id,
        costCenterName: center.nameAr || center.name,
        costDriver: center.costDriver,
        driverQuantity: driverQty,
        monthlyBudget: budget,
        allocatedFromShared: allocated,
        totalBudget,
        rate,
        rateUnit,
      });
    }

    return results;
  }

  // ─── Service Cost Breakdown ───
  async calculateServiceCost(
    tenantId: string,
    serviceId: string,
    laborCostSYP: number,
    materialCostSYP: number,
    estimatedDurationMinutes: number,
    estimatedMaterialMoves: number = 1,
    profitPercent: number = 0,
    profitAmountSYP: number = 0,
    exchangeRate: number = 15000
  ): Promise<ServiceCostBreakdownResponse> {
    const settings = await prisma.companySettings.findFirst({ where: { tenantId } });
    const monthlyWorkingHours = settings?.monthlyWorkingHours || 600;

    const rates = await this.calculateOverheadRates(tenantId);
    const costDetails: CostDetailItem[] = [];

    let variableOverhead = 0;
    let fixedOverhead = 0;
    let depreciation = 0;

    const hours = estimatedDurationMinutes / 60;

    for (const rate of rates) {
      let amount = 0;

      if (rate.costDriver === 'LABOR_HOURS') {
        amount = rate.rate * hours;
        fixedOverhead += amount;
      } else if (rate.costDriver === 'MATERIAL_MOVES') {
        amount = rate.rate * estimatedMaterialMoves;
        variableOverhead += amount;
      } else if (rate.costDriver === 'SERVICE_COUNT') {
        amount = rate.rate * 1;
        variableOverhead += amount;
      } else if (rate.costDriver === 'FIXED') {
        amount = rate.rate;
        fixedOverhead += amount;
      } else if (rate.costDriver === 'REVENUE_ALLOCATION') {
        continue; // Already included via allocations
      }

      if (amount > 0) {
        costDetails.push({
          costCenterId: rate.costCenterId,
          costCenterName: rate.costCenterName,
          costType: rate.costDriver === 'LABOR_HOURS' || rate.costDriver === 'FIXED' ? 'FIXED_OVERHEAD' : 'VARIABLE_OVERHEAD',
          amountSYP: amount,
          amountUSD: Number((amount / exchangeRate).toFixed(2)),
          isCalculated: true,
        });
      }
    }

    // Get asset depreciation
    const assets = await prisma.asset.findMany({ where: { tenantId, isActive: true } });
    for (const asset of assets) {
      const dep = Number(asset.monthlyDepreciation || 0);
      if (dep > 0) {
        const share = dep / (hours > 0 ? monthlyWorkingHours : 1);
        const assetAmount = share * hours;
        depreciation += assetAmount;
        costDetails.push({
          assetId: asset.id,
          costCenterName: asset.name,
          costType: 'DEPRECIATION',
          amountSYP: assetAmount,
          amountUSD: Number((assetAmount / exchangeRate).toFixed(2)),
          isCalculated: true,
        });
      }
    }

    const totalCost = laborCostSYP + materialCostSYP + variableOverhead + fixedOverhead + depreciation;
    const profit = profitAmountSYP > 0 ? profitAmountSYP : totalCost * (profitPercent / 100);
    const finalPrice = totalCost + profit;
    const finalPriceUSD = Number((finalPrice / exchangeRate).toFixed(2));

    return {
      serviceId,
      directLaborSYP: laborCostSYP,
      directMaterialSYP: materialCostSYP,
      variableOverheadSYP: variableOverhead,
      fixedOverheadSYP: fixedOverhead,
      depreciationSYP: depreciation,
      totalCostSYP: totalCost,
      profitAmountSYP: profit,
      finalPriceSYP: finalPrice,
      finalPriceUSD,
      costDetails,
    };
  }

  // ─── Service Cost Details ───
  async getServiceCostDetails(tenantId: string, serviceId: string): Promise<any[]> {
    const details = await prisma.serviceCostDetail.findMany({
      where: { tenantId, serviceId },
      include: {
        costCenter: { select: { id: true, name: true, nameAr: true } },
        asset: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return details.map((d: any) => ({
      id: d.id,
      costCenterId: d.costCenterId,
      assetId: d.assetId,
      costCenterName: d.costCenter?.nameAr || d.costCenter?.name || d.asset?.name,
      costType: d.costType,
      amountSYP: Number(d.amountSYP),
      amountUSD: d.amountUSD ? Number(d.amountUSD) : null,
      isCalculated: d.isCalculated,
      createdAt: d.createdAt,
    }));
  }

  async saveServiceCostDetails(
    tenantId: string,
    serviceId: string,
    details: { costCenterId?: string; assetId?: string; costType: string; amountSYP: number; amountUSD?: number }[]
  ): Promise<any[]> {
    await prisma.serviceCostDetail.deleteMany({ where: { tenantId, serviceId } });
    const created = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const d of details) {
        const item = await (tx as any).serviceCostDetail.create({
          data: {
            tenantId,
            serviceId,
            costCenterId: d.costCenterId || null,
            assetId: d.assetId || null,
            costType: d.costType as any,
            amountSYP: d.amountSYP,
            amountUSD: d.amountUSD ?? null,
            isCalculated: true,
          },
        });
        results.push(item);
      }
      return results;
    });
    return created;
  }

  // ─── Mappers ───
  private mapCostCenter(center: any): CostCenterResponse {
    return {
      id: center.id,
      tenantId: center.tenantId,
      name: center.name,
      nameAr: center.nameAr,
      type: center.type,
      costDriver: center.costDriver,
      driverQuantity: center.driverQuantity || 1,
      monthlyBudget: Number(center.monthlyBudget || 0),
      actualCost: center.actualCost ? Number(center.actualCost) : null,
      isActive: center.isActive,
      isDefault: center.isDefault,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
    };
  }
}

export const costCenterService = new CostCenterService();
