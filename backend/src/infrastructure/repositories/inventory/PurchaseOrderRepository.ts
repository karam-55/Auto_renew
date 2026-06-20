import { PurchaseOrderRepository as IPurchaseOrderRepository } from '../../../application/inventory/interfaces/PurchaseOrderRepository';
import { PurchaseOrder } from '../../../domain/inventory/po/entities/PurchaseOrder';
import { OrderNumber } from '../../../domain/inventory/po/value-objects/OrderNumber';
import { SupplierId } from '../../../domain/inventory/po/value-objects/SupplierId';
import { PurchaseOrderStatus } from '../../../domain/inventory/po/entities/PurchaseOrderStatus';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class PurchaseOrderRepository implements IPurchaseOrderRepository {
  async findById(id: string): Promise<PurchaseOrder | null> {
    try {
      const prisma = PrismaService.getInstance();
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: true,
          supplier: true,
        },
      });
      if (!po) return null;
      return this.mapToDomain(po);
    } catch (error) {
      throw new DatabaseError('Failed to find purchase order by id', error);
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    try {
      const prisma = PrismaService.getInstance();
      const po = await prisma.purchaseOrder.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          supplier: true,
        },
      });
      if (!po) return null;
      return this.mapToDomain(po);
    } catch (error) {
      throw new DatabaseError('Failed to find purchase order by number', error);
    }
  }

  async findByTenantId(tenantId: string): Promise<PurchaseOrder[]> {
    try {
      const prisma = PrismaService.getInstance();
      const pos = await prisma.purchaseOrder.findMany({
        where: { tenantId },
        include: {
          items: true,
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return pos.map(po => this.mapToDomain(po));
    } catch (error) {
      throw new DatabaseError('Failed to find purchase orders by tenant', error);
    }
  }

  async findBySupplierId(supplierId: string): Promise<PurchaseOrder[]> {
    try {
      const prisma = PrismaService.getInstance();
      const pos = await prisma.purchaseOrder.findMany({
        where: { supplierId },
        include: {
          items: true,
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return pos.map(po => this.mapToDomain(po));
    } catch (error) {
      throw new DatabaseError('Failed to find purchase orders by supplier', error);
    }
  }

  async create(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.purchaseOrder.create({
        data: {
          id: purchaseOrder.id,
          tenantId: purchaseOrder.tenantId,
          supplierId: purchaseOrder.supplierId.getValue(),
          orderNumber: purchaseOrder.orderNumber.getValue(),
          orderDate: purchaseOrder.orderDate,
          status: purchaseOrder.status as any,
          totalSYP: purchaseOrder.totalAmount,
          notes: purchaseOrder.notes,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      throw new DatabaseError('Failed to create purchase order', error);
    }
  }

  async update(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: purchaseOrder.status as any,
          totalSYP: purchaseOrder.totalAmount,
          notes: purchaseOrder.notes,
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      throw new DatabaseError('Failed to update purchase order', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.purchaseOrder.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete purchase order', error);
    }
  }

  private mapToDomain(data: any): PurchaseOrder {
    return new PurchaseOrder(
      data.id,
      data.tenantId,
      new OrderNumber(data.orderNumber),
      new SupplierId(data.supplierId),
      data.status as PurchaseOrderStatus,
      data.orderDate,
      data.totalSYP ? Number(data.totalSYP) : 0,
      data.createdAt,
      data.updatedAt,
      data.expectedDeliveryDate,
      data.notes
    );
  }
}
