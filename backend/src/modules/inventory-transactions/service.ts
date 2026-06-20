import prisma from '../../config/database';
import { TransactionType as PrismaTransactionType } from '@prisma/client';
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
import { createStockConsumptionJournalEntry } from '../accounting/automatic-journal-entries';

export class InventoryTransactionService {
  async createInventoryTransaction(
    tenantId: string,
    data: CreateInventoryTransactionDto
  ): Promise<InventoryTransaction> {
    // Verify part exists and belongs to tenant
    const part = await prisma.part.findFirst({
      where: { id: data.partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    // Validate quantity
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Validate unit cost
    if (data.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }

    // Validate warehouse is required
    if (!data.warehouseId) {
      throw new Error('Warehouse is required');
    }

    // Verify warehouse exists and belongs to tenant
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: data.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Validate supplier for PURCHASE transactions
    if (data.transactionType === 'PURCHASE' && !data.supplierId) {
      throw new Error('Supplier is required for PURCHASE transactions');
    }

    // Verify supplier exists and belongs to tenant (if provided)
    if (data.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, tenantId },
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }
    }

    // Validate STOCK_OUT doesn't exceed available quantity
    if (data.transactionType === 'SALE' || data.transactionType === 'CONSUMPTION' || data.transactionType === 'TRANSFER') {
      if (part.quantity < data.quantity) {
        throw new Error('Insufficient part quantity for this transaction');
      }
    }

    // Validate ADJUSTMENT requires reason
    if (data.transactionType === 'ADJUSTMENT' && !data.notes) {
      throw new Error('Adjustment transactions require a reason/notes');
    }

    // Calculate total cost
    const totalCost = data.quantity * data.unitCost;

    // Create transaction
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        tenantId,
        partId: data.partId,
        warehouseId: data.warehouseId,
        supplierId: data.supplierId,
        type: data.transactionType as PrismaTransactionType,
        quantity: data.quantity,
        costSYP: data.unitCost,
        reference: data.referenceType && data.referenceId
          ? `${data.referenceType}:${data.referenceId}`
          : null,
        notes: data.notes,
      },
    });

    // Update part quantity based on transaction type
    await this.updatePartQuantity(data.partId, data.transactionType, data.quantity);

    // Create auto-journal entry for CONSUMPTION transactions
    if (data.transactionType === 'CONSUMPTION') {
      try {
        const transactionWithPart = await prisma.inventoryTransaction.findUnique({
          where: { id: transaction.id },
          include: { part: true },
        });

        if (transactionWithPart) {
          await createStockConsumptionJournalEntry(transactionWithPart, tenantId, null);
        }
      } catch (error) {
        Logger.error('Error creating journal entry for stock consumption:', error);
        throw new Error('Inventory transaction recorded but journal entry creation failed. Please check the chart of accounts setup.');
      }
    }

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
    // Check if transaction exists and belongs to tenant
    const existingTransaction = await prisma.inventoryTransaction.findFirst({
      where: { id, tenantId },
    });

    if (!existingTransaction) {
      throw new Error('Inventory transaction not found');
    }

    // If updating partId, verify new part exists
    if (data.partId && data.partId !== existingTransaction.partId) {
      const part = await prisma.part.findFirst({
        where: { id: data.partId, tenantId },
      });

      if (!part) {
        throw new Error('Part not found');
      }
    }

    // If updating warehouseId, verify new warehouse exists
    if (data.warehouseId && data.warehouseId !== existingTransaction.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: data.warehouseId, tenantId },
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }
    }

    // Calculate new total cost if quantity or unitCost changed
    const quantity = data.quantity ?? existingTransaction.quantity;
    const unitCost = data.unitCost ?? Number(existingTransaction.costSYP);
    const totalCost = quantity * unitCost;

    // Revert old quantity change
    await this.updatePartQuantity(
      existingTransaction.partId,
      existingTransaction.type as TransactionType,
      -existingTransaction.quantity
    );

    // Apply new quantity change
    const newType = data.transactionType ?? (existingTransaction.type as TransactionType);
    await this.updatePartQuantity(data.partId ?? existingTransaction.partId, newType, quantity);

    // Update transaction
    const transaction = await prisma.inventoryTransaction.update({
      where: { id },
      data: {
        partId: data.partId,
        warehouseId: data.warehouseId,
        type: data.transactionType as PrismaTransactionType,
        quantity: data.quantity,
        costSYP: data.unitCost,
        reference: data.referenceType && data.referenceId
          ? `${data.referenceType}:${data.referenceId}`
          : existingTransaction.reference,
        notes: data.notes,
      },
      include: {
        part: true,
        warehouse: true,
      },
    });

    return this.mapToInventoryTransactionResponse(transaction);
  }

  async deleteInventoryTransaction(id: string, tenantId: string): Promise<void> {
    // Check if transaction exists and belongs to tenant
    const existingTransaction = await prisma.inventoryTransaction.findFirst({
      where: { id, tenantId },
    });

    if (!existingTransaction) {
      throw new Error('Inventory transaction not found');
    }

    // Revert quantity change
    await this.updatePartQuantity(
      existingTransaction.partId,
      existingTransaction.type as TransactionType,
      -existingTransaction.quantity
    );

    // Delete transaction
    await prisma.inventoryTransaction.delete({
      where: { id },
    });
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
    // Verify part exists and belongs to tenant
    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    // Check if part has sufficient quantity
    if (part.quantity < quantity) {
      throw new Error('Insufficient part quantity');
    }

    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify warehouse exists and belongs to tenant (if provided)
    if (warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({
        where: { id: warehouseId, tenantId },
      });

      if (!warehouse) {
        throw new Error('Warehouse not found');
      }
    }

    // Create consumption transaction
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        tenantId,
        partId,
        warehouseId,
        type: 'CONSUMPTION' as PrismaTransactionType,
        quantity,
        costSYP: part.costSYP,
        reference: `BOOKING:${bookingId}`,
        notes: notes || `Consumed for booking ${bookingId}`,
      },
    });

    // Update part quantity (decrease for consumption)
    await this.updatePartQuantity(partId, 'CONSUMPTION', quantity);

    // Create auto-journal entry for COGS
    try {
      const transactionWithPart = await prisma.inventoryTransaction.findUnique({
        where: { id: transaction.id },
        include: { part: true },
      });

      if (transactionWithPart) {
        await createStockConsumptionJournalEntry(transactionWithPart, tenantId, null);
      }
    } catch (error) {
      Logger.error('Error creating journal entry for stock consumption:', error);
      throw new Error('Inventory transaction recorded but journal entry creation failed. Please check the chart of accounts setup.');
    }

    return this.mapToInventoryTransactionResponse(transaction);
  }

  async createTransferTransaction(
    tenantId: string,
    partId: string,
    quantity: number,
    sourceWarehouseId: string,
    destinationWarehouseId: string,
    notes?: string
  ): Promise<{ outTransaction: InventoryTransaction; inTransaction: InventoryTransaction }> {
    // Verify part exists and belongs to tenant
    const part = await prisma.part.findFirst({
      where: { id: partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    // Check if part has sufficient quantity
    if (part.quantity < quantity) {
      throw new Error('Insufficient part quantity for transfer');
    }

    // Verify source warehouse exists and belongs to tenant
    const sourceWarehouse = await prisma.warehouse.findFirst({
      where: { id: sourceWarehouseId, tenantId },
    });

    if (!sourceWarehouse) {
      throw new Error('Source warehouse not found');
    }

    // Verify destination warehouse exists and belongs to tenant
    const destinationWarehouse = await prisma.warehouse.findFirst({
      where: { id: destinationWarehouseId, tenantId },
    });

    if (!destinationWarehouse) {
      throw new Error('Destination warehouse not found');
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      throw new Error('Source and destination warehouses cannot be the same');
    }

    // Create OUT transaction from source warehouse
    const outTransaction = await prisma.inventoryTransaction.create({
      data: {
        tenantId,
        partId,
        warehouseId: sourceWarehouseId,
        type: 'TRANSFER' as PrismaTransactionType,
        quantity,
        costSYP: part.costSYP,
        reference: `TRANSFER:${sourceWarehouseId}->${destinationWarehouseId}`,
        notes: notes || `Transfer to ${destinationWarehouse.name}`,
      },
    });

    // Create IN transaction to destination warehouse
    const inTransaction = await prisma.inventoryTransaction.create({
      data: {
        tenantId,
        partId,
        warehouseId: destinationWarehouseId,
        type: 'STOCK_IN' as PrismaTransactionType,
        quantity,
        costSYP: part.costSYP,
        reference: `TRANSFER:${sourceWarehouseId}->${destinationWarehouseId}`,
        notes: notes || `Transfer from ${sourceWarehouse.name}`,
      },
    });

    // Update part quantity (transfer doesn't change total quantity, just moves it)
    // The updatePartQuantity logic handles this correctly for TRANSFER

    return {
      outTransaction: this.mapToInventoryTransactionResponse(outTransaction),
      inTransaction: this.mapToInventoryTransactionResponse(inTransaction),
    };
  }

  private async updatePartQuantity(
    partId: string,
    transactionType: TransactionType,
    quantity: number
  ): Promise<void> {
    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    let quantityChange = 0;

    // Determine quantity change based on transaction type
    switch (transactionType) {
      case 'PURCHASE':
      case 'ADJUSTMENT':
      case 'RETURN':
        quantityChange = quantity;
        break;
      case 'SALE':
      case 'TRANSFER':
      case 'CONSUMPTION':
        quantityChange = -quantity;
        break;
    }

    const newQuantity = part.quantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error('Insufficient part quantity');
    }

    await prisma.part.update({
      where: { id: partId },
      data: {
        quantity: newQuantity,
      },
    });
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
      totalCost: Number(transaction.costSYP) * transaction.quantity,
      referenceType,
      referenceId,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
