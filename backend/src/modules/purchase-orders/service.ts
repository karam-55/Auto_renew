import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { createStockIntakeJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';
import {
  PurchaseOrder,
  PurchaseOrderLine,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreatePurchaseOrderLineDto,
  UpdatePurchaseOrderLineDto,
  PurchaseOrderFilters,
  PaginationParams,
  PaginatedResponse,
  PurchaseOrderStatus,
} from './types';

export class PurchaseOrderService {
  async createPurchaseOrder(tenantId: string, data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    // Check if supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({ where: { id: data.supplierId, tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    // Validate supplier is active
    if (!supplier.isActive) throw new Error('Supplier is not active');

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    let subtotalSYP = 0;
    let subtotalUSD = 0;
    const itemsToCreate = [] as any[];

    // Validate items if provided
    for (const item of data.items || []) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error('Item quantity must be a positive whole number');
      const suppliedSYP = item.unitCost ?? undefined;
      if (suppliedSYP == null && item.unitCostUSD == null) throw new Error('Item unit cost is required in USD or SYP');
      if (suppliedSYP != null && suppliedSYP < 0 || item.unitCostUSD != null && item.unitCostUSD < 0) {
        throw new Error('Item unit cost cannot be negative');
      }

      // Check if part exists
      const part = await prisma.part.findFirst({ where: { id: item.partId, tenantId } });
      if (!part) throw new Error(`Part with ID ${item.partId} not found`);

      const unitCostUSD = item.unitCostUSD != null
        ? Number(item.unitCostUSD)
        : Math.round((Number(suppliedSYP) / exchangeRate) * 100) / 100;
      const unitCostSYP = item.unitCostUSD != null
        ? Math.round(unitCostUSD * exchangeRate)
        : Number(suppliedSYP);
      const totalCostSYP = item.quantity * unitCostSYP;
      const totalCostUSD = Math.round(item.quantity * unitCostUSD * 100) / 100;
      subtotalSYP += totalCostSYP;
      subtotalUSD += totalCostUSD;
      itemsToCreate.push({
        tenantId,
        partId: item.partId,
        quantity: item.quantity,
        costSYP: unitCostSYP,
        costUSD: unitCostUSD,
        totalSYP: totalCostSYP,
        totalUSD: totalCostUSD,
        receivedQty: 0,
      });
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);
    const totalSYP = subtotalSYP;
    const totalUSD = Math.round(subtotalUSD * 100) / 100;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        orderNumber,
        orderDate: data.orderDate || new Date(),
        totalSYP,
        totalUSD,
        status: 'PENDING' as PrismaOrderStatus,
        notes: data.notes,
        items: { create: itemsToCreate },
      },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: { include: { part: { select: { id: true, partNumber: true, name: true } } } },
      },
    });

    return this.mapToPurchaseOrderResponse(purchaseOrder);
  }

  async getPurchaseOrders(
    tenantId: string,
    filters: PurchaseOrderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<PurchaseOrder>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { supplierId, status, fromDate, toDate, search } = filters;

    const where: any = { tenantId };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) {
        where.orderDate.gte = fromDate;
      }
      if (toDate) {
        where.orderDate.lte = toDate;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: purchaseOrders.map((po) => this.mapToPurchaseOrderResponse(po)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPurchaseOrderById(id: string, tenantId: string): Promise<PurchaseOrder | null> {
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return null;
    }

    return this.mapToPurchaseOrderResponse(purchaseOrder);
  }

  async updatePurchaseOrder(id: string, tenantId: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    // Check if purchase order exists and belongs to tenant
    const existingPurchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!existingPurchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // If updating supplier, check if new supplier exists and belongs to tenant
    if (data.supplierId && data.supplierId !== existingPurchaseOrder.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, tenantId },
      });

      if (!supplier) {
        throw new Error('Supplier not found');
      }
    }

    // Recalculate totals if items are being updated (handled separately)
    // For now, just update the basic fields
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        status: data.status as PrismaOrderStatus,
        notes: data.notes,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToPurchaseOrderResponse(purchaseOrder);
  }

  async deletePurchaseOrder(id: string, tenantId: string): Promise<void> {
    // Check if purchase order exists and belongs to tenant
    const existingPurchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!existingPurchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if purchase order has been approved
    if (existingPurchaseOrder.status === 'APPROVED' || 
        existingPurchaseOrder.status === 'RECEIVED') {
      throw new Error('Cannot delete approved or received purchase orders');
    }

    // Check if purchase order has any goods receipt notes
    const grnCount = await prisma.goodsReceiptNote.count({
      where: { purchaseOrderId: id },
    });

    if (grnCount > 0) {
      throw new Error('Cannot delete purchase order with existing goods receipt notes');
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  async addPurchaseOrderLine(purchaseOrderId: string, tenantId: string, data: CreatePurchaseOrderLineDto): Promise<PurchaseOrder> {
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, tenantId },
      include: {
        items: true,
      },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if purchase order can be modified
    if (purchaseOrder.status === 'APPROVED' || 
        purchaseOrder.status === 'RECEIVED' ||
        purchaseOrder.status === 'CANCELLED') {
      throw new Error('Cannot add items to approved, received, or cancelled purchase orders');
    }

    // Check if part exists
    const part = await prisma.part.findFirst({
      where: { id: data.partId, tenantId },
    });

    if (!part) {
      throw new Error('Part not found');
    }

    if (!Number.isInteger(data.quantity) || data.quantity <= 0) throw new Error('Item quantity must be a positive whole number');
    if (data.unitCost == null && data.unitCostUSD == null) throw new Error('Item unit cost is required in USD or SYP');
    if (data.unitCost != null && data.unitCost < 0 || data.unitCostUSD != null && data.unitCostUSD < 0) throw new Error('Item unit cost cannot be negative');
    const rate = await settingsService.getRequiredExchangeRate(tenantId);
    const unitCostUSD = data.unitCostUSD != null
      ? Number(data.unitCostUSD)
      : Math.round((Number(data.unitCost) / rate) * 100) / 100;
    const unitCostSYP = data.unitCostUSD != null
      ? Math.round(unitCostUSD * rate)
      : Number(data.unitCost);
    const totalCostSYP = data.quantity * unitCostSYP;
    const totalCostUSD = Math.round(data.quantity * unitCostUSD * 100) / 100;

    // Add the new line item
    await prisma.purchaseOrderItem.create({
      data: {
        tenantId,
        purchaseOrderId,
        partId: data.partId,
        quantity: data.quantity,
        costSYP: unitCostSYP,
        costUSD: unitCostUSD,
        totalSYP: totalCostSYP,
        totalUSD: totalCostUSD,
        receivedQty: 0,
      },
    });

    // Recalculate totals
    await this.recalculateTotals(purchaseOrderId);

    // Return updated purchase order
    return this.getPurchaseOrderById(purchaseOrderId, tenantId) as Promise<PurchaseOrder>;
  }

  async updatePurchaseOrderLine(lineId: string, tenantId: string, data: UpdatePurchaseOrderLineDto): Promise<PurchaseOrder> {
    // Check if line item exists
    const lineItem = await prisma.purchaseOrderItem.findFirst({
      where: { id: lineId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!lineItem) {
      throw new Error('Line item not found');
    }

    // Check tenant ownership
    if (lineItem.purchaseOrder.tenantId !== tenantId) {
      throw new Error('Line item not found');
    }

    // Check if purchase order can be modified
    if (lineItem.purchaseOrder.status === 'APPROVED' || 
        lineItem.purchaseOrder.status === 'RECEIVED' ||
        lineItem.purchaseOrder.status === 'CANCELLED') {
      throw new Error('Cannot modify items in approved, received, or cancelled purchase orders');
    }

    // Update the line item
    const updateData: any = {};
    const quantity = data.quantity ?? lineItem.quantity;
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Item quantity must be a positive whole number');
    if (data.quantity !== undefined) updateData.quantity = quantity;

    let unitCostSYP = Number(lineItem.costSYP);
    let unitCostUSD = lineItem.costUSD == null ? null : Number(lineItem.costUSD);
    if (data.unitCostUSD != null || data.unitCost != null) {
      if (data.unitCostUSD != null && data.unitCostUSD < 0 || data.unitCost != null && data.unitCost < 0) {
        throw new Error('Item unit cost cannot be negative');
      }
      const rate = await settingsService.getRequiredExchangeRate(tenantId);
      if (data.unitCostUSD != null) {
        unitCostUSD = Number(data.unitCostUSD);
        unitCostSYP = Math.round(unitCostUSD * rate);
      } else {
        unitCostSYP = Number(data.unitCost);
        unitCostUSD = Math.round((unitCostSYP / rate) * 100) / 100;
      }
      updateData.costSYP = unitCostSYP;
      updateData.costUSD = unitCostUSD;
    }
    if (data.receivedQuantity !== undefined) {
      if (!Number.isInteger(data.receivedQuantity) || data.receivedQuantity < 0 || data.receivedQuantity > quantity) {
        throw new Error('Received quantity must be between zero and ordered quantity');
      }
      updateData.receivedQty = data.receivedQuantity;
    }

    if (data.quantity !== undefined || data.unitCost !== undefined || data.unitCostUSD !== undefined) {
      if (unitCostUSD == null) {
        const rate = await settingsService.getRequiredExchangeRate(tenantId);
        unitCostUSD = Math.round((unitCostSYP / rate) * 100) / 100;
        updateData.costUSD = unitCostUSD;
      }
      updateData.totalSYP = quantity * unitCostSYP;
      updateData.totalUSD = Math.round(quantity * unitCostUSD * 100) / 100;
    }

    await prisma.purchaseOrderItem.update({
      where: { id: lineId },
      data: updateData,
    });

    // Recalculate totals
    await this.recalculateTotals(lineItem.purchaseOrderId);

    // Return updated purchase order
    return this.getPurchaseOrderById(lineItem.purchaseOrderId, tenantId) as Promise<PurchaseOrder>;
  }

  async removePurchaseOrderLine(lineId: string, tenantId: string): Promise<PurchaseOrder> {
    // Check if line item exists
    const lineItem = await prisma.purchaseOrderItem.findFirst({
      where: { id: lineId },
      include: {
        purchaseOrder: true,
      },
    });

    if (!lineItem) {
      throw new Error('Line item not found');
    }

    // Check tenant ownership
    if (lineItem.purchaseOrder.tenantId !== tenantId) {
      throw new Error('Line item not found');
    }

    // Check if purchase order can be modified
    if (lineItem.purchaseOrder.status === 'APPROVED' || 
        lineItem.purchaseOrder.status === 'RECEIVED' ||
        lineItem.purchaseOrder.status === 'CANCELLED') {
      throw new Error('Cannot remove items from approved, received, or cancelled purchase orders');
    }

    // Delete the line item
    await prisma.purchaseOrderItem.delete({
      where: { id: lineId },
    });

    // Recalculate totals
    await this.recalculateTotals(lineItem.purchaseOrderId);

    // Return updated purchase order
    return this.getPurchaseOrderById(lineItem.purchaseOrderId, tenantId) as Promise<PurchaseOrder>;
  }

  async approvePurchaseOrder(id: string, tenantId: string, userId: string): Promise<PurchaseOrder> {
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if purchase order can be approved
    if (purchaseOrder.status !== 'PENDING') {
      throw new Error('Purchase order can only be approved from PENDING status');
    }

    // Check if purchase order has items
    const itemsCount = await prisma.purchaseOrderItem.count({
      where: { purchaseOrderId: id },
    });

    if (itemsCount === 0) {
      throw new Error('Cannot approve purchase order without items');
    }

    // Update purchase order status
    const updatedPurchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED' as PrismaOrderStatus,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToPurchaseOrderResponse(updatedPurchaseOrder);
  }

  async cancelPurchaseOrder(id: string, tenantId: string): Promise<PurchaseOrder> {
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if purchase order can be cancelled
    if (purchaseOrder.status === 'RECEIVED') {
      throw new Error('Cannot cancel received purchase orders');
    }

    // Update purchase order status
    const updatedPurchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED' as PrismaOrderStatus,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.mapToPurchaseOrderResponse(updatedPurchaseOrder);
  }

  async receivePurchaseOrder(id: string, tenantId: string, userId: string): Promise<PurchaseOrder> {
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const current = await tx.purchaseOrder.findFirst({
        where: { id, tenantId },
        include: { items: true },
      });
      if (!current) throw new Error('Purchase order not found');
      if (current.status !== 'APPROVED' && current.status !== 'PENDING') {
        throw new Error('Can only receive approved or pending purchase orders');
      }
      if (current.items.length === 0) throw new Error('Cannot receive a purchase order without items');

      const claim = await tx.purchaseOrder.updateMany({
        where: { id, tenantId, status: current.status },
        data: { status: 'RECEIVED' },
      });
      if (claim.count !== 1) throw new Error('Purchase order status changed; reload and retry');
      await ensureDefaultAccounts(tenantId, tx);

      for (const item of current.items) {
        const quantity = item.quantity - item.receivedQty;
        if (quantity <= 0) continue;
        const part = await tx.part.findFirst({ where: { id: item.partId, tenantId } });
        if (!part) throw new Error(`Part with ID ${item.partId} not found`);

        const unitCostSYP = Number(item.costSYP);
        const unitCostUSD = item.costUSD != null
          ? Number(item.costUSD)
          : Math.round((unitCostSYP / exchangeRate) * 100) / 100;
        const currentQuantity = part.quantity;
        const newQuantity = currentQuantity + quantity;
        const currentCostUSD = part.costUSD != null
          ? Number(part.costUSD)
          : Math.round((Number(part.costSYP || 0) / exchangeRate) * 100) / 100;
        const currentCostSYP = part.costUSD != null
          ? Math.round(currentCostUSD * exchangeRate)
          : Number(part.costSYP || 0);
        const stockUpdate = await tx.part.updateMany({
          where: { id: part.id, tenantId, quantity: currentQuantity },
          data: {
            quantity: { increment: quantity },
            costSYP: currentQuantity > 0
              ? (currentCostSYP * currentQuantity + unitCostSYP * quantity) / newQuantity
              : unitCostSYP,
            costUSD: currentQuantity > 0
              ? (currentCostUSD * currentQuantity + unitCostUSD * quantity) / newQuantity
              : unitCostUSD,
          },
        });
        if (stockUpdate.count !== 1) throw new Error(`Stock changed concurrently for part ${part.name}`);

        const transaction = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            partId: item.partId,
            supplierId: current.supplierId,
            type: 'PURCHASE',
            quantity,
            costSYP: unitCostSYP,
            costUSD: unitCostUSD,
            reference: current.orderNumber,
            notes: `Received from purchase order ${current.orderNumber}`,
            createdBy: userId,
          },
          include: { part: { select: { name: true } } },
        });
        await createStockIntakeJournalEntry(transaction, tenantId, 'PAYABLE', userId, tx);
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQty: item.quantity,
            costUSD: unitCostUSD,
            totalUSD: Math.round(item.quantity * unitCostUSD * 100) / 100,
          },
        });
      }

      return tx.purchaseOrder.findFirst({
        where: { id, tenantId },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: { include: { part: { select: { id: true, partNumber: true, name: true } } } },
        },
      });
    }, { isolationLevel: 'Serializable' });

    if (!purchaseOrder) throw new Error('Purchase order not found after receipt');
    return this.mapToPurchaseOrderResponse(purchaseOrder);
  }

  async generateOrderNumber(_tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await prisma.purchaseOrderNumberSequence.upsert({
      where: { year },
      create: { year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return `PO-${year}-${String(sequence.lastValue).padStart(5, '0')}`;
  }

  private async recalculateTotals(purchaseOrderId: string): Promise<void> {
    const [items, purchaseOrder] = await Promise.all([
      prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId } }),
      prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, select: { tenantId: true } }),
    ]);
    if (!purchaseOrder) throw new Error('Purchase order not found');

    const rate = await settingsService.getRequiredExchangeRate(purchaseOrder.tenantId);
    const subtotalSYP = items.reduce((sum, item) => sum + Number(item.totalSYP), 0);
    const subtotalUSD = items.reduce((sum, item) => sum + (item.totalUSD != null
      ? Number(item.totalUSD)
      : Math.round((Number(item.totalSYP) / rate) * 100) / 100), 0);

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        totalSYP: subtotalSYP,
        totalUSD: Math.round(subtotalUSD * 100) / 100,
      },
    });
  }

  private mapToPurchaseOrderResponse(purchaseOrder: any): PurchaseOrder {
    const items = purchaseOrder.items?.map((item: any) => ({
      id: item.id,
      purchaseOrderId: item.purchaseOrderId,
      partId: item.partId,
      quantity: item.quantity,
      unitCost: Number(item.costSYP),
      unitCostUSD: item.costUSD == null ? null : Number(item.costUSD),
      totalCost: Number(item.totalSYP),
      totalCostUSD: item.totalUSD == null ? null : Number(item.totalUSD),
      receivedQuantity: item.receivedQty,
      part: item.part ? {
        id: item.part.id,
        partNumber: item.part.partNumber,
        name: item.part.name,
      } : undefined,
    })) || [];

    const total = Number(purchaseOrder.totalSYP);
    const totalUSD = purchaseOrder.totalUSD == null ? null : Number(purchaseOrder.totalUSD);
    const subtotal = items.reduce((sum: number, item: PurchaseOrderLine) => sum + item.totalCost, 0);
    const subtotalUSD = items.every((item: PurchaseOrderLine) => item.totalCostUSD != null)
      ? items.reduce((sum: number, item: PurchaseOrderLine) => sum + Number(item.totalCostUSD), 0)
      : null;
    const tax = total - subtotal;
    const taxUSD = totalUSD != null && subtotalUSD != null ? totalUSD - subtotalUSD : null;

    return {
      id: purchaseOrder.id,
      tenantId: purchaseOrder.tenantId,
      orderNumber: purchaseOrder.orderNumber,
      supplierId: purchaseOrder.supplierId,
      warehouseId: undefined, // Not in schema yet
      orderDate: purchaseOrder.orderDate,
      expectedDate: undefined, // Not in schema yet
      status: purchaseOrder.status as PurchaseOrderStatus,
      subtotal,
      subtotalUSD,
      tax,
      taxUSD,
      total,
      totalUSD,
      notes: purchaseOrder.notes,
      approvedBy: purchaseOrder.approvedBy,
      approvedAt: purchaseOrder.approvedAt,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
      supplier: purchaseOrder.supplier ? {
        id: purchaseOrder.supplier.id,
        name: purchaseOrder.supplier.name,
        phone: purchaseOrder.supplier.phone,
      } : undefined,
      items,
    };
  }
}
