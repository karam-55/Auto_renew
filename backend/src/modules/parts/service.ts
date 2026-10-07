import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import {
  Part,
  CreatePartDto,
  UpdatePartDto,
  StockIntakeDto,
  PartFilters,
  PaginationParams,
  PaginatedResponse,
  PartStatus,
} from './types';

/**
 * USD is the base currency — auto-fill the missing side from the exchange rate.
 * Mutates the given fields object in place.
 */
async function fillMissingCurrencyFields(
  tenantId: string,
  fields: { costSYP?: number; costUSD?: number; sellingPriceSYP?: number; sellingPriceUSD?: number }
): Promise<void> {
  const settings = await settingsService.getSettings(tenantId);
  const rate = settings.exchangeRate > 0 ? settings.exchangeRate : 15000;
  if (fields.costUSD != null && fields.costUSD > 0 && !(fields.costSYP != null && fields.costSYP > 0)) {
    fields.costSYP = Math.round(fields.costUSD * rate);
  }
  if (fields.costSYP != null && fields.costSYP > 0 && !(fields.costUSD != null && fields.costUSD > 0)) {
    fields.costUSD = Math.round((fields.costSYP / rate) * 100) / 100;
  }
  if (fields.sellingPriceUSD != null && fields.sellingPriceUSD > 0 && !(fields.sellingPriceSYP != null && fields.sellingPriceSYP > 0)) {
    fields.sellingPriceSYP = Math.round(fields.sellingPriceUSD * rate);
  }
  if (fields.sellingPriceSYP != null && fields.sellingPriceSYP > 0 && !(fields.sellingPriceUSD != null && fields.sellingPriceUSD > 0)) {
    fields.sellingPriceUSD = Math.round((fields.sellingPriceSYP / rate) * 100) / 100;
  }
}

export class PartService {
  async createPart(tenantId: string, data: CreatePartDto): Promise<Part> {
    await fillMissingCurrencyFields(tenantId, data as any);
    const part = await prisma.part.create({
      data: {
        tenantId,
        partNumber: data.partNumber,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        costSYP: data.costSYP,
        costUSD: data.costUSD,
        sellingPriceSYP: data.sellingPriceSYP,
        sellingPriceUSD: data.sellingPriceUSD,
        quantity: data.quantity ?? 0,
        minQuantity: data.minQuantity ?? 5,
        baseUnitName: data.baseUnitName,
        purchaseUnitName: data.purchaseUnitName,
        unitsPerPackage: data.unitsPerPackage,
        location: data.location,
        isActive: data.isActive ?? true,
      },
    });

    return this.mapToPartResponse(part);
  }

  async getParts(
    tenantId: string,
    filters: PartFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<Part>> {
    // limit === 0 means "all rows" (lookup mode). Default to 10 for list views.
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { categoryId, supplierId, status, minQuantity, maxQuantity, search } = filters;
    const isLookupAll = limit === 0;

    const where: any = { tenantId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      if (status === PartStatus.OUT_OF_STOCK) {
        where.quantity = { ...(where.quantity || {}), lte: 0 };
      } else if (status === PartStatus.DISCONTINUED) {
        where.isActive = false;
      } else if ((status as string) === 'LOW') {
        // Low stock: 0 < quantity < minQuantity (column-to-column via field reference)
        where.quantity = { ...(where.quantity || {}), gt: 0, lt: prisma.part.fields.minQuantity };
      } else if ((status as string) === 'OK') {
        where.quantity = { ...(where.quantity || {}), gte: prisma.part.fields.minQuantity };
      } else {
        where.isActive = true;
      }
    }

    if (minQuantity !== undefined) {
      where.quantity = { ...where.quantity, gte: minQuantity };
    }

    if (maxQuantity !== undefined) {
      where.quantity = { ...where.quantity, lte: maxQuantity };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        // limit === 0 → "all rows": omit skip/take so Prisma returns everything.
        skip: isLookupAll ? undefined : (page - 1) * limit,
        take: isLookupAll ? undefined : limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.part.count({ where }),
    ]);

    return {
      data: parts.map((part) => this.mapToPartResponse(part)),
      total,
      page,
      limit,
      // limit === 0 → "all rows": avoid division by zero, report a single page.
      totalPages: isLookupAll ? 1 : Math.ceil(total / limit),
    };
  }

  async getPartById(id: string, tenantId: string): Promise<Part | null> {
    const part = await prisma.part.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!part) {
      return null;
    }

    return this.mapToPartResponse(part);
  }

  async updatePart(id: string, tenantId: string, data: UpdatePartDto): Promise<Part> {
    // Check if part exists and belongs to tenant
    const existingPart = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    await fillMissingCurrencyFields(tenantId, data as any);

    const part = await prisma.part.update({
      where: { id },
      data: {
        partNumber: data.partNumber,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        costSYP: data.costSYP,
        costUSD: data.costUSD,
        sellingPriceSYP: data.sellingPriceSYP,
        sellingPriceUSD: data.sellingPriceUSD,
        quantity: data.quantity,
        minQuantity: data.minQuantity,
        baseUnitName: data.baseUnitName,
        purchaseUnitName: data.purchaseUnitName,
        unitsPerPackage: data.unitsPerPackage,
        location: data.location,
        isActive: data.isActive,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return this.mapToPartResponse(part);
  }

  async deletePart(id: string, tenantId: string): Promise<void> {
    // Check if part exists and belongs to tenant
    const existingPart = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    // Check if part is used in any inventory transactions
    const inventoryTransactionsCount = await prisma.inventoryTransaction.count({
      where: { partId: id },
    });

    if (inventoryTransactionsCount > 0) {
      throw new Error('Cannot delete part with existing inventory transactions');
    }

    // Check if part is used in any purchase order items
    const purchaseOrderItemsCount = await prisma.purchaseOrderItem.count({
      where: { partId: id },
    });

    if (purchaseOrderItemsCount > 0) {
      throw new Error('Cannot delete part with existing purchase order items');
    }

    // Check if part is used in any invoice items
    const invoiceItemsCount = await prisma.invoiceItem.count({
      where: { partId: id },
    });

    if (invoiceItemsCount > 0) {
      throw new Error('Cannot delete part with existing invoice items');
    }

    await prisma.part.delete({
      where: { id },
    });
  }

  async searchParts(tenantId: string, query: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
          { partNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return parts.map((part) => this.mapToPartResponse(part));
  }

  async updateQuantity(id: string, tenantId: string, quantityChange: number): Promise<Part> {
    const part = await prisma.part.findFirst({
      where: { id, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    const newQuantity = part.quantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error('Insufficient quantity');
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data: {
        quantity: newQuantity,
      },
    });

    return this.mapToPartResponse(updatedPart);
  }

  /**
   * Stock intake with package→unit conversion and weighted-average cost.
   * Accepts either `packages` (requires unitsPerPackage on the part) or direct `units`.
   * Records a STOCK_IN InventoryTransaction for a complete movement audit trail.
   */
  async stockIntake(id: string, tenantId: string, data: StockIntakeDto): Promise<Part> {
    const part = await prisma.part.findFirst({ where: { id, tenantId } });

    if (!part) {
      throw new Error('Part not found');
    }

    const hasPackages = data.packages != null && data.packages > 0;
    const hasUnits = data.units != null && data.units > 0;

    if (!hasPackages && !hasUnits) {
      throw new Error('Quantity is required (packages or units)');
    }
    if (hasPackages && data.packages! < 0) {
      throw new Error('Packages cannot be negative');
    }
    if (hasUnits && data.units! < 0) {
      throw new Error('Units cannot be negative');
    }

    let units: number;
    let unitCostSYP: number;
    let unitCostUSD: number | null = null;

    if (hasPackages) {
      const upp = part.unitsPerPackage;
      if (!upp || upp <= 0) {
        throw new Error('This part has no package conversion configured (unitsPerPackage)');
      }
      if (data.packageCostSYP == null || data.packageCostSYP < 0) {
        throw new Error('Package cost (SYP) is required');
      }
      units = data.packages! * upp;
      unitCostSYP = data.packageCostSYP / upp;
      if (data.packageCostUSD != null) {
        if (data.packageCostUSD < 0) throw new Error('Package cost cannot be negative');
        unitCostUSD = data.packageCostUSD / upp;
      }
    } else {
      units = data.units!;
      if (data.unitCostSYP == null || data.unitCostSYP < 0) {
        throw new Error('Unit cost (SYP) is required');
      }
      unitCostSYP = data.unitCostSYP;
      if (data.unitCostUSD != null) {
        if (data.unitCostUSD < 0) throw new Error('Unit cost cannot be negative');
        unitCostUSD = data.unitCostUSD;
      }
    }

    // Weighted average cost (AVCO) — SYP and USD independently
    const currentQty = part.quantity;
    const newQty = currentQty + units;
    const currentCostSYP = Number(part.costSYP) || 0;
    const avgCostSYP = currentQty > 0
      ? (currentCostSYP * currentQty + unitCostSYP * units) / newQty
      : unitCostSYP;

    const currentCostUSD = part.costUSD != null ? Number(part.costUSD) : null;
    let avgCostUSD: number | null | undefined;
    if (unitCostUSD != null) {
      avgCostUSD = currentQty > 0 && currentCostUSD != null
        ? (currentCostUSD * currentQty + unitCostUSD * units) / newQty
        : unitCostUSD;
    } else {
      avgCostUSD = currentCostUSD; // keep existing USD cost when not provided
    }

    const intakeNote = hasPackages
      ? `Stock intake: ${data.packages} ${part.purchaseUnitName || 'package(s)'} × ${part.unitsPerPackage} ${part.baseUnitName || 'unit(s)'}`
      : `Stock intake: ${units} ${part.baseUnitName || 'unit(s)'}`;

    const [updatedPart] = await prisma.$transaction([
      prisma.part.update({
        where: { id },
        data: {
          quantity: newQty,
          costSYP: avgCostSYP,
          ...(avgCostUSD != null ? { costUSD: avgCostUSD } : {}),
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          tenantId,
          partId: id,
          type: 'STOCK_IN',
          quantity: units,
          costSYP: unitCostSYP,
          ...(unitCostUSD != null ? { costUSD: unitCostUSD } : {}),
          notes: data.notes?.trim() || intakeNote,
        },
      }),
    ]);

    return this.mapToPartResponse(updatedPart);
  }

  async getLowStockParts(tenantId: string): Promise<Part[]> {
    const parts = await prisma.part.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
    });

    // Filter parts where quantity <= minQuantity
    const lowStockParts = parts.filter((part) => part.quantity <= part.minQuantity);

    return lowStockParts.map((part) => this.mapToPartResponse(part));
  }

  private mapToPartResponse(part: any): Part {
    return {
      id: part.id,
      tenantId: part.tenantId,
      partNumber: part.partNumber,
      name: part.name,
      nameAr: part.nameAr,
      nameEn: part.nameEn,
      description: part.description,
      categoryId: part.categoryId,
      category: part.category ? { id: part.category.id, name: part.category.name } : undefined,
      supplierId: part.supplierId,
      costSYP: Number(part.costSYP),
      costUSD: part.costUSD ? Number(part.costUSD) : undefined,
      sellingPriceSYP: Number(part.sellingPriceSYP),
      sellingPriceUSD: part.sellingPriceUSD ? Number(part.sellingPriceUSD) : undefined,
      quantity: part.quantity,
      minQuantity: part.minQuantity,
      baseUnitName: part.baseUnitName,
      purchaseUnitName: part.purchaseUnitName,
      unitsPerPackage: part.unitsPerPackage,
      location: part.location,
      isActive: part.isActive,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
    };
  }
}
