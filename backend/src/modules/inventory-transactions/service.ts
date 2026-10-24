import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';
import { isValidQuantity } from '../../utils/quantity';
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
  createStockRevaluationJournalEntry,
  ensureDefaultAccounts,
} from '../accounting/automatic-journal-entries';

const movementRelations = {
  part: true,
  warehouse: true,
  supplier: { select: { id: true, name: true } },
  service: { select: { id: true, name: true, nameAr: true } },
  bookingService: {
    include: { service: { select: { id: true, name: true, nameAr: true } } },
  },
  booking: {
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
    },
  },
};

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE: 'شراء مادة',
  SALE: 'بيع مادة',
  ADJUSTMENT: 'تسوية رصيد المخزون',
  TRANSFER: 'نقل بين المستودعات',
  RETURN: 'مرتجع',
  CONSUMPTION: 'استهلاك في عمل',
  STOCK_IN: 'إدخال إلى المخزون',
  STOCK_OUT: 'إخراج من المخزون',
};

export class InventoryTransactionService {
  async createInventoryTransaction(
    tenantId: string,
    data: CreateInventoryTransactionDto,
    createdBy?: string
  ): Promise<InventoryTransaction> {
    if (!isValidQuantity(data.quantity)) throw new Error('Quantity must be positive and use at most three decimal places');
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
      const bookingId = data.referenceType?.toUpperCase() === 'BOOKING' ? data.referenceId : undefined;
      if (bookingId) {
        const booking = await tx.booking.findFirst({ where: { id: bookingId, tenantId } });
        if (!booking) throw new Error('Booking not found in this tenant');
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
          bookingId,
          notes: data.notes,
        },
        include: movementRelations,
      });

      await this.updatePartQuantity(data.partId, data.transactionType, data.quantity, tenantId, tx);
      let previousQuantity = 0;
      let previousCostSYP = 0;
      let previousCostUSD = 0;
      if (data.transactionType === 'PURCHASE' || data.transactionType === 'STOCK_IN') {
        previousQuantity = Number(part.quantity);
        previousCostSYP = Number(part.costSYP || 0);
        previousCostUSD = part.costUSD != null
          ? Number(part.costUSD)
          : Math.round((previousCostSYP / exchangeRate) * 100) / 100;
        await tx.part.update({
          where: { id: part.id },
          data: { costSYP: unitCost, costUSD: unitCostUSD },
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
        if (previousQuantity > 0) {
          await createStockRevaluationJournalEntry(
            created, tenantId, previousQuantity, previousCostSYP, previousCostUSD, unitCost, unitCostUSD, createdBy || null, tx
          );
        }
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
          ...movementRelations,
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
      include: movementRelations,
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
        data.quantity !== undefined && Number(data.quantity) !== Number(existing.quantity) ||
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
        include: movementRelations,
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
          ...movementRelations,
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
          ...movementRelations,
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
    if (!isValidQuantity(quantity)) throw new Error('Transfer quantity must be positive and use at most three decimal places');
    if (sourceWarehouseId === destinationWarehouseId) throw new Error('Source and destination warehouses cannot be the same');

    const result = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id: partId, tenantId } });
      if (!part) throw new Error('Part not found');
      if (Number(part.quantity) < quantity) throw new Error('Insufficient part quantity for transfer');

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
          include: movementRelations,
        }),
        tx.inventoryTransaction.create({
          data: {
            tenantId, partId, warehouseId: destinationWarehouseId,
            type: 'STOCK_IN', quantity, costSYP: part.costSYP, costUSD: part.costUSD,
            reference, notes: notes || `Transfer from ${sourceWarehouse.name}`,
          },
          include: movementRelations,
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
    if (Number(part.quantity) + quantityChange < 0) throw new Error('Insufficient part quantity');

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

    const booking = transaction.booking
    const customerName = booking?.customer?.fullName || null
    const vehicle = booking?.vehicle
    const vehicleDescription = vehicle
      ? [vehicle.make, vehicle.model, vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''].filter(Boolean).join(' ')
      : null
    const serviceName = transaction.bookingService?.service?.nameAr
      || transaction.bookingService?.service?.name
      || transaction.service?.nameAr
      || transaction.service?.name
      || null
    const bookingDestination = booking
      ? [
          customerName ? `العميل ${customerName}` : 'حجز',
          vehicleDescription ? `السيارة ${vehicleDescription}` : '',
          serviceName ? `خدمة ${serviceName}` : '',
        ].filter(Boolean).join(' · ')
      : null
    const referenceDescription = this.describeReference(referenceType, transaction)
    const supplierDestination = transaction.supplier?.name
      ? `استلام من المورد ${transaction.supplier.name}${referenceDescription ? ` · ${referenceDescription}` : ''}`
      : null
    const noteDescription = this.describeNotes(transaction.notes)
    const warehouseDescription = transaction.warehouse?.name ? `مستودع ${transaction.warehouse.name}` : null
    const destinationDescription = bookingDestination
      || supplierDestination
      || referenceDescription
      || noteDescription
      || warehouseDescription
      || 'حركة مخزون مسجلة'
    const transferNotes = String(transaction.notes || '')
    const transferReference = String(transaction.reference || '')
    const direction = ['PURCHASE', 'RETURN', 'STOCK_IN'].includes(transaction.type)
      ? 'IN'
      : ['SALE', 'CONSUMPTION', 'STOCK_OUT'].includes(transaction.type)
        ? 'OUT'
        : transaction.type === 'TRANSFER'
          ? /صرف التحويل|transfer\s+out/i.test(`${transferNotes} ${transferReference}`)
            ? 'OUT'
            : /استلام التحويل|transfer\s+in/i.test(`${transferNotes} ${transferReference}`)
              ? 'IN'
              : 'TRANSFER'
          : transaction.type === 'ADJUSTMENT'
            ? /نقص|عجز|تخفيض/.test(transferNotes) ? 'OUT' : /زيادة|فائض/.test(transferNotes) ? 'IN' : 'ADJUSTMENT'
            : 'ADJUSTMENT'

    return {
      id: transaction.id,
      tenantId: transaction.tenantId,
      partId: transaction.partId,
      warehouseId: transaction.warehouseId,
      transactionType: transaction.type as TransactionType,
      quantity: Math.abs(Number(transaction.quantity)),
      unitCost: Number(transaction.costSYP),
      unitCostUSD: transaction.costUSD == null ? null : Number(transaction.costUSD),
      totalCost: Number(transaction.costSYP) * Math.abs(Number(transaction.quantity)),
      totalCostUSD: transaction.costUSD == null ? null : Number(transaction.costUSD) * Math.abs(Number(transaction.quantity)),
      referenceType,
      referenceId,
      notes: transaction.notes,
      partName: transaction.part?.nameAr || transaction.part?.name || undefined,
      unitName: transaction.part?.baseUnitName || null,
      warehouseName: transaction.warehouse?.name || null,
      supplierName: transaction.supplier?.name || null,
      bookingId: transaction.bookingId || booking?.id || null,
      customerName,
      vehicleDescription,
      serviceName,
      destinationDescription,
      transactionLabel: MOVEMENT_LABELS[transaction.type] || 'حركة مخزون',
      direction,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  private describeReference(referenceType: string | null, transaction: any): string | null {
    if (!referenceType) return null;
    const type = referenceType.toUpperCase();
    const referenceId = String(transaction.reference || '').split(':').slice(1).join(':');
    if (type === 'BOOKING' || type === 'WORKORDER') return transaction.booking ? 'أمر شغل' : 'حجز مرتبط';
    if (type === 'INVOICE') {
      const notes = String(transaction.notes || '');
      if (/[\u0600-\u06ff]/.test(notes)) return notes;
      return referenceId ? `فاتورة مبيعات رقم ${referenceId}` : 'فاتورة مبيعات';
    }
    if (type === 'GRN') {
      const grnNumber = String(transaction.reference || '').split(':').slice(1).join(':');
      return grnNumber ? `سند استلام ${grnNumber}` : 'استلام بضاعة من مورد';
    }
    if (type === 'PO') return referenceId ? `طلب شراء ${referenceId}` : 'استلام بموجب طلب شراء';
    if (type === 'COUNT') {
      const notes = String(transaction.notes || '');
      if (/[\u0600-\u06ff]/.test(notes)) return notes;
      return referenceId ? `جرد مخزون ${referenceId}` : 'تسوية ناتجة عن جرد المخزون';
    }
    if (type === 'CANCEL') return null;
    if (type === 'RETURN') return referenceId ? `مرتجع من الفاتورة ${referenceId}` : 'مرتجع إلى المخزون';
    if (type.startsWith('TRANSFER OUT')) return 'صرف تحويل من المستودع';
    if (type.startsWith('TRANSFER IN')) return 'استلام تحويل إلى المستودع';
    if (type === 'TRANSFER') {
      const notes = String(transaction.notes || '');
      if (/[\u0600-\u06ff]/.test(notes)) return notes;
      return 'نقل بين المستودعات';
    }
    if (type === 'INTAKE') return 'استلام مخزون';
    return 'مرجع حركة مخزون';
  }

  private describeNotes(notes: string | null | undefined): string | null {
    const text = String(notes || '').trim();
    if (!text) return null;
    if (/[\u0600-\u06ff]/.test(text)) return text;
    if (/^material issued for work order/i.test(text)) return 'مواد مصروفة لأمر الشغل';
    if (/^consumed for booking/i.test(text)) return 'مواد مستهلكة لحجز';
    if (/^stock intake/i.test(text)) return 'استلام مواد إلى المخزون';
    if (/^transfer to/i.test(text)) return 'نقل إلى مستودع آخر';
    if (/^transfer from/i.test(text)) return 'نقل من مستودع آخر';
    if (/^inventory adjustment/i.test(text)) return 'تسوية كمية المخزون';
    if (/^stock out/i.test(text)) return 'إخراج مواد من المخزون';
    return 'تفاصيل إضافية مسجلة للحركة';
  }
}
