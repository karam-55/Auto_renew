import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';
import {
  InventoryTransaction,
  CreateInventoryTransactionDto,
  UpdateInventoryTransactionDto,
  InventoryTransactionFilters,
  PaginationParams,
  PaginatedResponse,
  ConsumePartDto,
  TransactionType,
} from './types';
import {
  createInventoryAdjustmentJournalEntry,
  createStockConsumptionJournalEntry,
  createStockIntakeJournalEntry,
  ensureDefaultAccounts,
} from '../accounting/automatic-journal-entries';

export class InventoryTransactionService {
  async createInventoryTransaction(
    tenantId: string,
    data: CreateInventoryTransactionDto,
    createdBy?: string
  ): Promise<InventoryTransaction> {
    if (!Number.isInteger(data.quantity) || data.quantity <= 0) throw new Error('Quantity must be a positive whole number');
    if (data.unitCost != null && data.unitCost < 0 || data.unitCostUSD != null && data.unitCostUSD < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    const usesPartAverageCost = ['CONSUMPTION', 'SALE', 'ADJUSTMENT', 'STOCK_OUT'].includes(data.transactionType);
    if (data.unitCost == null && data.unitCostUSD == null && !usesPartAverageCost) {
      throw new Error('Unit cost is required in USD or SYP');
    }
    if (data.transactionType === 'ADJUSTMENT' && !data.notes) throw new Error('Adjustment transactions require a reason/notes');
    if (data.transactionType === 'STOCK_OUT' && !data.notes) throw new Error('Stock-out transactions require a reason/notes');
    if (data.transactionType === 'TRANSFER') throw new Error('Use the paired transfer endpoint for warehouse transfers');
    if (data.transactionType === 'RETURN') throw new Error('Returns must be linked to the original sale or GRN movement');
    if (data.settlementAccount && !['CASH', 'BANK', 'PAYABLE'].includes(data.settlementAccount)) {
      throw new Error('Invalid stock settlement account');
    }

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    let unitCostUSD = data.unitCostUSD != null
      ? Number(data.unitCostUSD)
      : data.unitCost != null ? Math.round((Number(data.unitCost) / exchangeRate) * 100) / 100 : 0;
    let unitCost = data.unitCostUSD != null
      ? Math.round(unitCostUSD * exchangeRate)
      : data.unitCost != null ? Number(data.unitCost) : 0;

    const transaction = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id: data.partId, tenantId } });
      if (!part) throw new Error('Part not found');
      if (['CONSUMPTION', 'SALE', 'ADJUSTMENT', 'STOCK_OUT'].includes(data.transactionType)) {
        unitCostUSD = part.costUSD != null
          ? Number(part.costUSD)
          : Math.round((Number(part.costSYP) / exchangeRate) * 100) / 100;
        unitCost = part.costUSD != null
          ? Math.round(unitCostUSD * exchangeRate)
          : Number(part.costSYP);
      }

      if (data.warehouseId) {
        const warehouse = await tx.warehouse.findFirst({ where: { id: data.warehouseId, tenantId } });
        if (!warehouse) throw new Error('Warehouse not found');
      }
      if (data.supplierId) {
        const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, tenantId } });
        if (!supplier) throw new Error('Supplier not found');
      }

      const created = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          partId: data.partId,
          warehouseId: data.warehouseId,
          supplierId: data.supplierId,
          createdBy,
          type: data.transactionType as PrismaTransactionType,
          quantity: data.quantity,
          costSYP: unitCost,
          costUSD: unitCostUSD,
          reference: data.referenceType && data.referenceId ? `${data.referenceType}:${data.referenceId}` : null,
          notes: data.notes,
        },
        include: { part: true },
      });

      await this.updatePartQuantity(data.partId, data.transactionType, data.quantity, tenantId, tx);
      if (data.transactionType === 'PURCHASE' || data.transactionType === 'STOCK_IN') {
        const currentCostSYP = Number(part.costSYP || 0);
        const currentCostUSD = part.costUSD != null
          ? Number(part.costUSD)
          : Math.round((currentCostSYP / exchangeRate) * 100) / 100;
        const resultingQuantity = part.quantity + data.quantity;
        await tx.part.update({
          where: { id: part.id },
          data: {
            costSYP: part.quantity > 0
              ? (currentCostSYP * part.quantity + unitCost * data.quantity) / resultingQuantity
              : unitCost,
            costUSD: part.quantity > 0
              ? (currentCostUSD * part.quantity + unitCostUSD * data.quantity) / resultingQuantity
              : unitCostUSD,
          },
        });
      }
      if (data.transactionType === 'CONSUMPTION' || data.transactionType === 'SALE') {
        await createStockConsumptionJournalEntry(created, tenantId, createdBy || null, tx);
      }
      if (data.transactionType === 'PURCHASE' || data.transactionType === 'STOCK_IN') {
        const settlement = data.settlementAccount || (data.transactionType === 'PURCHASE' ? 'PAYABLE' : undefined);
        if (!settlement) throw new Error('A settlement account is required for stock intake');
        await ensureDefaultAccounts(tenantId, tx);
        await createStockIntakeJournalEntry(created, tenantId, settlement, createdBy || null, tx);
      }
      if (data.transactionType === 'ADJUSTMENT' || data.transactionType === 'STOCK_OUT') {
        await ensureDefaultAccounts(tenantId, tx);
        await createInventoryAdjustmentJournalEntry(
          created,
          tenantId,
          data.transactionType === 'ADJUSTMENT' ? 'IN' : 'OUT',
          createdBy || null,
          tx
        );
      }
      return created;
    }, { isolationLevel: 'Serializable' });

    return this.mapToInventoryTransactionResponse(transaction);
  }

  async getInventoryTransactions(
    tenantId: string,
    filters: InventoryTransactionFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const {
      partId,
      warehouseId,
      transactionType,
      referenceType,
      referenceId,
      startDate,
      endDate,
    } = filters;

    const where: any = { tenantId };

    if (partId) {
      where.partId = partId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (transactionType) {
      where.type = transactionType;
    }

    if (referenceType && referenceId) {
      where.reference = `${referenceType}:${referenceId}`;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          part: true,
          warehouse: true,
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => this.mapToInventoryTransactionResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInventoryTransactionById(
    id: string,
    tenantId: string
  ): Promise<InventoryTransaction | null> {
    const transaction = await prisma.inventoryTransaction.findFirst({
      where: { id, tenantId },
      include: {
        part: true,
        warehouse: true,
      },
    });

    if (!transaction) {
      return null;
    }

    return this.mapToInventoryTransactionResponse(transaction);
  }

  async updateInventoryTransaction(
    id: string,
    tenantId: string,
    data: UpdateInventoryTransactionDto
  ): Promise<InventoryTransaction> {
    const existing = await prisma.inventoryTransaction.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Inventory transaction not found');

    if (data.partId !== undefined && data.partId !== existing.partId ||
        data.transactionType !== undefined && data.transactionType !== existing.type ||
        data.quantity !== undefined && data.quantity !== existing.quantity ||
        data.unitCost !== undefined && data.unitCost !== Number(existing.costSYP) ||
        data.unitCostUSD !== undefined && data.unitCostUSD !== Number(existing.costUSD || 0)) {
      throw new Error('Posted inventory movements are immutable; record a compensating movement instead');
    }

    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, tenantId } });
      if (!warehouse) throw new Error('Warehouse not found');
    }
    if (data.supplierId) {
      const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, tenantId } });
      if (!supplier) throw new Error('Supplier not found');
    }

    const reference = data.referenceType !== undefined || data.referenceId !== undefined
      ? [data.referenceType, data.referenceId].filter(Boolean).join(':') || null
      : existing.reference;
    const transaction = await prisma.inventoryTransaction.update({
      where: { id },
      data: {
        warehouseId: data.warehouseId,
        supplierId: data.supplierId,
        reference,
        notes: data.notes,
      },
      include: { part: true, warehouse: true },
    });
    return this.mapToInventoryTransactionResponse(transaction);
  }

  async deleteInventoryTransaction(id: string, tenantId: string): Promise<void> {
    const existingTransaction = await prisma.inventoryTransaction.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existingTransaction) throw new Error('Inventory transaction not found');
    throw new Error('Posted inventory movements cannot be deleted; record a compensating stock movement instead');
  }

  async getPartHistory(
    tenantId: string,
    partId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    // Verify part exists and belongs to tenant
    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    const where = { tenantId, partId };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          part: true,
          warehouse: true,
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => this.mapToInventoryTransactionResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWarehouseTransactions(
    tenantId: string,
    warehouseId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    // Verify warehouse exists and belongs to tenant
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const where = { tenantId, warehouseId };

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          part: true,
          warehouse: true,
        },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions.map((t) => this.mapToInventoryTransactionResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createConsumptionTransaction(
    tenantId: string,
    partId: string,
    quantity: number,
    bookingId: string,
    warehouseId?: string,
    notes?: string
  ): Promise<InventoryTransaction> {
    const part = await prisma.part.findFirst({ where: { id: partId, tenantId } });
    if (!part) throw new Error('Part not found');
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, tenantId } });
    if (!booking) throw new Error('Booking not found');

    return this.createInventoryTransaction(tenantId, {
      partId,
      warehouseId,
      transactionType: 'CONSUMPTION',
      quantity,
      unitCost: Number(part.costSYP),
      unitCostUSD: part.costUSD == null ? undefined : Number(part.costUSD),
      referenceType: 'BOOKING',
      referenceId: bookingId,
      notes: notes || `Consumed for booking ${bookingId}`,
    });
  }

  async createTransferTransaction(
    tenantId: string,
    partId: string,
    quantity: number,
    sourceWarehouseId: string,
    destinationWarehouseId: string,
    notes?: string
  ): Promise<{ outTransaction: InventoryTransaction; inTransaction: InventoryTransaction }> {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Transfer quantity must be a positive whole number');
    if (sourceWarehouseId === destinationWarehouseId) throw new Error('Source and destination warehouses cannot be the same');

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id: partId, tenantId } });
      if (!part) throw new Error('Part not found');
      if (part.quantity < quantity) throw new Error('Insufficient part quantity for transfer');

      const [sourceWarehouse, destinationWarehouse] = await Promise.all([
        tx.warehouse.findFirst({ where: { id: sourceWarehouseId, tenantId } }),
        tx.warehouse.findFirst({ where: { id: destinationWarehouseId, tenantId } }),
      ]);
      if (!sourceWarehouse) throw new Error('Source warehouse not found');
      if (!destinationWarehouse) throw new Error('Destination warehouse not found');

      const reference = `TRANSFER:${sourceWarehouseId}->${destinationWarehouseId}`;
      const [outTransaction, inTransaction] = await Promise.all([
        tx.inventoryTransaction.create({
          data: {
            tenantId, partId, warehouseId: sourceWarehouseId,
            type: 'TRANSFER', quantity, costSYP: part.costSYP, costUSD: part.costUSD,
            reference, notes: notes || `Transfer to ${destinationWarehouse.name}`,
          },
        }),
        tx.inventoryTransaction.create({
          data: {
            tenantId, partId, warehouseId: destinationWarehouseId,
            type: 'STOCK_IN', quantity, costSYP: part.costSYP, costUSD: part.costUSD,
            reference, notes: notes || `Transfer from ${sourceWarehouse.name}`,
          },
        }),
      ]);
      return { outTransaction, inTransaction };
    }, { isolationLevel: 'Serializable' });

    return {
      outTransaction: this.mapToInventoryTransactionResponse(result.outTransaction),
      inTransaction: this.mapToInventoryTransactionResponse(result.inTransaction),
    };
  }

  private async updatePartQuantity(
    partId: string,
    transactionType: TransactionType,
    quantity: number,
    tenantId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const part = await tx.part.findFirst({ where: { id: partId, tenantId } });
    if (!part) throw new Error('Part not found');

    const increasesStock = transactionType === 'PURCHASE' || transactionType === 'STOCK_IN' ||
      transactionType === 'RETURN' || transactionType === 'ADJUSTMENT';
    const quantityChange = increasesStock ? quantity : -quantity;
    if (part.quantity + quantityChange < 0) throw new Error('Insufficient part quantity');

    const result = await tx.part.updateMany({
      where: { id: partId, tenantId, quantity: part.quantity },
      data: { quantity: { increment: quantityChange } },
    });
    if (result.count !== 1) throw new Error('Part quantity changed concurrently; retry the transaction');
  }

  private mapToInventoryTransactionResponse(transaction: any): InventoryTransaction {
    const [referenceType, referenceId] = transaction.reference
      ? transaction.reference.split(':')
      : [null, null];

    return {
      id: transaction.id,
      tenantId: transaction.tenantId,
      partId: transaction.partId,
      warehouseId: transaction.warehouseId,
      transactionType: transaction.type as TransactionType,
      quantity: transaction.quantity,
      unitCost: Number(transaction.costSYP),
      unitCostUSD: transaction.costUSD == null ? null : Number(transaction.costUSD),
      totalCost: Number(transaction.costSYP) * transaction.quantity,
      totalCostUSD: transaction.costUSD == null ? null : Number(transaction.costUSD) * transaction.quantity,
      referenceType,
      referenceId,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
