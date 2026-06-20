import prisma from '../../config/database';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
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
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, tenantId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Validate supplier is active
    if (!supplier.isActive) {
      throw new Error('Supplier is not active');
    }

    // Validate items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.quantity <= 0) {
          throw new Error('Item quantity must be greater than 0');
        }
        if (item.unitCost <= 0) {
          throw new Error('Item unit cost must be greater than 0');
        }

        // Check if part exists
        const part = await prisma.part.findFirst({
          where: { id: item.partId, tenantId },
        });
        if (!part) {
          throw new Error(`Part with ID ${item.partId} not found`);
        }
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Calculate totals from items if provided
    let subtotal = 0;
    let tax = 0;
    const itemsToCreate = data.items?.map((item) => {
      const totalCost = item.quantity * item.unitCost;
      subtotal += totalCost;
      return {
        tenantId,
        partId: item.partId,
        quantity: item.quantity,
        costSYP: item.unitCost,
        totalSYP: totalCost,
        receivedQty: 0,
      };
    }) || [];

    // Calculate tax (assuming 10% tax rate - can be made configurable)
    tax = subtotal * 0.1;
    const total = subtotal + tax;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        orderNumber,
        orderDate: data.orderDate || new Date(),
        totalSYP: total,
        totalUSD: null,
        status: 'PENDING' as PrismaOrderStatus,
        notes: data.notes,
        items: {
          create: itemsToCreate,
        },
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

    const totalCost = data.quantity * data.unitCost;

    // Add the new line item
    await prisma.purchaseOrderItem.create({
      data: {
        tenantId,
        purchaseOrderId,
        partId: data.partId,
        quantity: data.quantity,
        costSYP: data.unitCost,
        totalSYP: totalCost,
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
    if (data.quantity !== undefined) {
      updateData.quantity = data.quantity;
    }
    if (data.unitCost !== undefined) {
      updateData.costSYP = data.unitCost;
    }
    if (data.receivedQuantity !== undefined) {
      updateData.receivedQty = data.receivedQuantity;
    }

    // Recalculate total if quantity or unit cost changed
    if (data.quantity !== undefined || data.unitCost !== undefined) {
      const quantity = data.quantity ?? lineItem.quantity;
      const unitCost = data.unitCost ?? Number(lineItem.costSYP);
      updateData.totalSYP = quantity * unitCost;
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
    // Check if purchase order exists and belongs to tenant
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if purchase order can be received (must be APPROVED/SENT)
    if (purchaseOrder.status !== 'APPROVED' && purchaseOrder.status !== 'PENDING') {
      throw new Error('Can only receive approved or pending purchase orders');
    }

    // Get company settings to check autoUpdatePurchasePrice
    const companySettings = await prisma.companySettings.findUnique({
      where: { tenantId },
    });

    // Default to true if setting doesn't exist
    const autoUpdatePurchasePrice = true;

    // Process each item
    for (const item of purchaseOrder.items) {
      // Create PURCHASE inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          tenantId,
          partId: item.partId,
          type: 'PURCHASE',
          quantity: item.quantity,
          costSYP: Number(item.costSYP),
          costUSD: item.costUSD ? Number(item.costUSD) : null,
          reference: purchaseOrder.orderNumber,
          notes: `Received from purchase order ${purchaseOrder.orderNumber}`,
        },
      });

      // Add quantity to inventory
      await prisma.part.update({
        where: { id: item.partId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      // Update purchase price if setting is enabled
      if (autoUpdatePurchasePrice) {
        await prisma.part.update({
          where: { id: item.partId },
          data: {
            costSYP: item.costSYP,
            costUSD: item.costUSD,
          },
        });
      }

      // Update received quantity
      await prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: {
          receivedQty: item.quantity,
        },
      });
    }

    // Update purchase order status to RECEIVED
    const updatedPurchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'RECEIVED' as PrismaOrderStatus,
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

  async generateOrderNumber(tenantId: string): Promise<string> {
    // Get the current year
    const year = new Date().getFullYear();
    
    // Find the last order number for this tenant and year
    const lastOrder = await prisma.purchaseOrder.findFirst({
      where: {
        tenantId,
        orderNumber: {
          startsWith: `PO-${year}-`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequenceNumber = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequenceNumber = lastSequence + 1;
    }

    // Format: PO-YYYY-XXXXX (5-digit sequence)
    return `PO-${year}-${sequenceNumber.toString().padStart(5, '0')}`;
  }

  private async recalculateTotals(purchaseOrderId: string): Promise<void> {
    const items = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.totalSYP), 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        totalSYP: total,
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
      totalCost: Number(item.totalSYP),
      receivedQuantity: item.receivedQty,
      part: item.part ? {
        id: item.part.id,
        partNumber: item.part.partNumber,
        name: item.part.name,
      } : undefined,
    })) || [];

    const total = Number(purchaseOrder.totalSYP);
    const subtotal = items.reduce((sum: number, item: PurchaseOrderLine) => sum + item.totalCost, 0);
    const tax = total - subtotal;

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
      tax,
      total,
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
