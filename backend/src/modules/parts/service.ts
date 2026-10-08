import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { createInventoryAdjustmentJournalEntry, createStockIntakeJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';
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
  const rate = await settingsService.getRequiredExchangeRate(tenantId);
  if (fields.costUSD != null && fields.costUSD > 0) {
    fields.costSYP = Math.round(fields.costUSD * rate);
  } else if (fields.costSYP != null && fields.costSYP > 0) {
    fields.costUSD = Math.round((fields.costSYP / rate) * 100) / 100;
  }
  if (fields.sellingPriceUSD != null && fields.sellingPriceUSD > 0) {
    fields.sellingPriceSYP = Math.round(fields.sellingPriceUSD * rate);
  } else if (fields.sellingPriceSYP != null && fields.sellingPriceSYP > 0) {
    fields.sellingPriceUSD = Math.round((fields.sellingPriceSYP / rate) * 100) / 100;
  }
}

export class PartService {
  async createPart(tenantId: string, data: CreatePartDto): Promise<Part> {
    if (data.quantity != null && data.quantity !== 0) {
      throw new Error('Create the part first, then record initial stock through stock intake');
    }
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

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return {
      data: await Promise.all(parts.map((part) => this.mapToPartResponse(part, exchangeRate))),
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
    if (data.quantity != null && data.quantity !== existingPart.quantity) {
      throw new Error('Use a recorded inventory adjustment to change part quantity');
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

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return Promise.all(parts.map((part) => this.mapToPartResponse(part, exchangeRate)));
  }

  async updateQuantity(
    id: string,
    tenantId: string,
    quantityChange: number,
    createdBy?: string,
    reason?: string
  ): Promise<Part> {
    if (!Number.isInteger(quantityChange) || quantityChange === 0) {
      throw new Error('quantityChange must be a non-zero whole number');
    }
    if (!reason?.trim()) throw new Error('A reason is required for inventory adjustment');
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);

    const updatedPart = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id, tenantId } });
      if (!part) throw new Error('Part not found');

      const quantity = Math.abs(quantityChange);
      const costUSD = part.costUSD != null
        ? Number(part.costUSD)
        : Math.round((Number(part.costSYP) / exchangeRate) * 100) / 100;
      const costSYP = part.costUSD != null ? Math.round(costUSD * exchangeRate) : Number(part.costSYP);
      const result = await tx.part.updateMany({
        where: { id, tenantId, quantity: quantityChange < 0 ? { gte: quantity } : part.quantity },
        data: { quantity: { increment: quantityChange } },
      });
      if (result.count !== 1) throw new Error('Insufficient quantity or stock changed; retry');

      const transaction = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          partId: id,
          type: quantityChange > 0 ? 'STOCK_IN' : 'STOCK_OUT',
          quantity,
          costSYP,
          costUSD,
          createdBy,
          notes: reason.trim(),
        },
        include: { part: { select: { name: true } } },
      });
      await ensureDefaultAccounts(tenantId, tx);
      await createInventoryAdjustmentJournalEntry(
        transaction,
        tenantId,
        quantityChange > 0 ? 'IN' : 'OUT',
        createdBy || null,
        tx
      );
      return tx.part.findFirst({ where: { id, tenantId }, include: { category: { select: { id: true, name: true } } } });
    }, { isolationLevel: 'Serializable' });

    if (!updatedPart) throw new Error('Part not found after inventory adjustment');
    return this.mapToPartResponse(updatedPart, exchangeRate);
  }

  /**
   * Stock intake with package→unit conversion and weighted-average cost.
   * Accepts either `packages` (requires unitsPerPackage on the part) or direct `units`.
   * Records a STOCK_IN InventoryTransaction for a complete movement audit trail.
   */
  async stockIntake(id: string, tenantId: string, data: StockIntakeDto, createdBy?: string): Promise<Part> {
    const hasPackages = data.packages != null;
    const hasUnits = data.units != null;
    if (hasPackages === hasUnits) throw new Error('Provide exactly one of packages or units');
    if (!['CASH', 'BANK', 'PAYABLE'].includes(data.settlementAccount)) {
      throw new Error('Choose whether the intake was paid by cash, bank, or remains payable');
    }
    const idempotencyKey = data.idempotencyKey?.trim();
    if (!idempotencyKey || idempotencyKey.length > 128) throw new Error('A valid idempotency key is required for stock intake');

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    let expectedReference = '';
    try {
      return await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id, tenantId } });
      if (!part) throw new Error('Part not found');

      let units: number;
      let unitCostSYP: number;
      let unitCostUSD: number;
      if (hasPackages) {
        const packages = Number(data.packages);
        const upp = part.unitsPerPackage;
        if (!Number.isInteger(packages) || packages <= 0) throw new Error('Packages must be a positive whole number');
        if (!upp || upp <= 0) throw new Error('This part has no package conversion configured (unitsPerPackage)');
        if (data.packageCostSYP == null && data.packageCostUSD == null) throw new Error('Package cost is required in USD or SYP');
        if (data.packageCostSYP != null && data.packageCostSYP < 0 || data.packageCostUSD != null && data.packageCostUSD < 0) {
          throw new Error('Package cost cannot be negative');
        }
        const packageCostUSD = data.packageCostUSD != null
          ? Number(data.packageCostUSD)
          : Math.round((Number(data.packageCostSYP) / exchangeRate) * 100) / 100;
        const packageCostSYP = data.packageCostUSD != null
          ? Math.round(packageCostUSD * exchangeRate)
          : Number(data.packageCostSYP);
        units = packages * upp;
        unitCostSYP = packageCostSYP / upp;
        unitCostUSD = packageCostUSD / upp;
      } else {
        units = Number(data.units);
        if (!Number.isInteger(units) || units <= 0) throw new Error('Units must be a positive whole number');
        if (data.unitCostSYP == null && data.unitCostUSD == null) throw new Error('Unit cost is required in USD or SYP');
        if (data.unitCostSYP != null && data.unitCostSYP < 0 || data.unitCostUSD != null && data.unitCostUSD < 0) {
          throw new Error('Unit cost cannot be negative');
        }
        unitCostUSD = data.unitCostUSD != null
          ? Number(data.unitCostUSD)
          : Math.round((Number(data.unitCostSYP) / exchangeRate) * 100) / 100;
        unitCostSYP = data.unitCostUSD != null
          ? Math.round(unitCostUSD * exchangeRate)
          : Number(data.unitCostSYP);
      }

      expectedReference = `INTAKE:${idempotencyKey}:${data.settlementAccount}:${units}:${unitCostSYP}:${unitCostUSD}`;
      const existingIntake = await tx.inventoryTransaction.findFirst({
        where: { tenantId, idempotencyKey },
      });
      if (existingIntake) {
        if (existingIntake.partId !== id || existingIntake.reference !== expectedReference) {
          throw new Error('Idempotency key was already used for a different stock intake');
        }
        const currentPart = await tx.part.findFirst({
          where: { id, tenantId },
          include: { category: { select: { id: true, name: true } } },
        });
        if (!currentPart) throw new Error('Part not found after intake');
        return this.mapToPartResponse(currentPart, exchangeRate);
      }

      const currentQty = part.quantity;
      const newQty = currentQty + units;
      const currentCostSYP = part.costUSD != null
        ? Math.round(Number(part.costUSD) * exchangeRate)
        : Number(part.costSYP) || 0;
      const avgCostSYP = currentQty > 0
        ? (currentCostSYP * currentQty + unitCostSYP * units) / newQty
        : unitCostSYP;
      const currentCostUSD = part.costUSD != null
        ? Number(part.costUSD)
        : currentQty > 0 ? Math.round((currentCostSYP / exchangeRate) * 100) / 100 : 0;
      const avgCostUSD = currentQty > 0
        ? (currentCostUSD * currentQty + unitCostUSD * units) / newQty
        : unitCostUSD;
      const intakeNote = hasPackages
        ? `Stock intake: ${data.packages} ${part.purchaseUnitName || 'package(s)'} × ${part.unitsPerPackage} ${part.baseUnitName || 'unit(s)'}`
        : `Stock intake: ${units} ${part.baseUnitName || 'unit(s)'}`;

      const updated = await tx.part.updateMany({
        where: { id, tenantId, quantity: currentQty },
        data: { quantity: { increment: units }, costSYP: avgCostSYP, costUSD: avgCostUSD },
      });
      if (updated.count !== 1) throw new Error('Stock changed concurrently; retry the intake');

      await ensureDefaultAccounts(tenantId, tx);
      const transaction = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          partId: id,
          type: 'STOCK_IN',
          quantity: units,
          costSYP: unitCostSYP,
          costUSD: unitCostUSD,
          idempotencyKey,
          reference: expectedReference,
          createdBy,
          notes: data.notes?.trim() || intakeNote,
        },
        include: { part: { select: { name: true } } },
      });
      await createStockIntakeJournalEntry(transaction, tenantId, data.settlementAccount, createdBy || null, tx);

      const updatedPart = await tx.part.findFirst({
        where: { id, tenantId },
        include: { category: { select: { id: true, name: true } } },
      });
      if (!updatedPart) throw new Error('Part not found after intake');
      return this.mapToPartResponse(updatedPart, exchangeRate);
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if ((error as any)?.code === 'P2002' && expectedReference) {
        const existingIntake = await prisma.inventoryTransaction.findFirst({
          where: { tenantId, idempotencyKey },
        });
        if (existingIntake) {
          if (existingIntake.partId !== id || existingIntake.reference !== expectedReference) {
            throw new Error('Idempotency key was already used for a different stock intake');
          }
          const existingPart = await this.getPartById(id, tenantId);
          if (existingPart) return existingPart;
        }
      }
      throw error;
    }
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
    const lowStockParts = parts.filter((part) => part.isActive && part.quantity <= part.minQuantity);

    const exchangeRate = Number((await settingsService.getSettings(tenantId)).exchangeRate);
    return Promise.all(lowStockParts.map((part) => this.mapToPartResponse(part, exchangeRate)));
  }

  private async mapToPartResponse(part: any, exchangeRate?: number): Promise<Part> {
    const rate = exchangeRate ?? Number((await settingsService.getSettings(part.tenantId)).exchangeRate);
    const costUSD = part.costUSD == null ? undefined : Number(part.costUSD);
    const sellingPriceUSD = part.sellingPriceUSD == null ? undefined : Number(part.sellingPriceUSD);
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
      costSYP: costUSD != null && rate > 0 ? Math.round(costUSD * rate) : Number(part.costSYP),
      costUSD,
      sellingPriceSYP: sellingPriceUSD != null && rate > 0 ? Math.round(sellingPriceUSD * rate) : Number(part.sellingPriceSYP),
      sellingPriceUSD,
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
