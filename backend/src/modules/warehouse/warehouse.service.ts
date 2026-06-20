import { Warehouse, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class WarehouseService {
  async getAllWarehouses(tenantId: string, branchId?: string): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
      },
      include: {
        branch: true,
        manager: true,
        _count: {
          select: {
            inventoryTransactions: true,
            inventoryCounts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseById(id: string, tenantId: string): Promise<Warehouse | null> {
    return prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        manager: true,
        inventoryTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createWarehouse(data: Prisma.WarehouseCreateInput): Promise<Warehouse> {
    // If this is the first warehouse for the branch, make it primary
    const branchId = (data as any).branchId;
    const tenantId = (data as any).tenantId;
    
    const branchWarehouses = await prisma.warehouse.findMany({
      where: {
        branchId,
        tenantId,
      },
    });

    const isFirstWarehouse = branchWarehouses.length === 0;

    return prisma.warehouse.create({
      data: {
        ...data,
        isPrimary: isFirstWarehouse,
      },
      include: {
        branch: true,
      },
    });
  }

  async updateWarehouse(id: string, tenantId: string, data: Prisma.WarehouseUpdateInput): Promise<Warehouse> {
    return prisma.warehouse.update({
      where: { id, tenantId },
      data,
      include: {
        branch: true,
      },
    });
  }

  async deleteWarehouse(id: string, tenantId: string): Promise<Warehouse> {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryTransactions: true,
            inventoryCounts: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    if (warehouse.isPrimary) {
      throw new Error('Cannot delete primary warehouse. Set another warehouse as primary first.');
    }

    if (warehouse._count.inventoryTransactions > 0 || warehouse._count.inventoryCounts > 0) {
      throw new Error('Cannot delete warehouse with existing inventory transactions or counts');
    }

    return prisma.warehouse.delete({
      where: { id, tenantId },
    });
  }

  async getWarehouseStock(warehouseId: string, tenantId: string) {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        warehouseId,
        tenantId,
      },
      include: {
        part: true,
      },
    });

    const stockMap = new Map<string, { part: Prisma.PartGetPayload<{}>; quantity: number }>();

    transactions.forEach((transaction) => {
      const partId = transaction.partId;
      // PURCHASE and ADJUSTMENT with positive quantity add to stock
      // SALE, CONSUMPTION, and RETURN with positive quantity subtract from stock
      // TRANSFER transactions handle both directions with signed quantities
      let quantity = transaction.quantity;
      if (transaction.type === 'SALE' || transaction.type === 'CONSUMPTION' || transaction.type === 'RETURN') {
        quantity = -quantity;
      }

      if (!stockMap.has(partId)) {
        stockMap.set(partId, {
          part: transaction.part,
          quantity: 0,
        });
      }

      stockMap.get(partId)!.quantity += quantity;
    });

    return Array.from(stockMap.values()).map((item) => ({
      part: item.part,
      quantity: item.quantity,
    }));
  }

  async getWarehousesByBranch(branchId: string, tenantId: string): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      where: {
        branchId,
        tenantId,
      },
      include: {
        manager: true,
      },
      orderBy: { isPrimary: 'desc' },
    });
  }

  async setPrimaryWarehouse(warehouseId: string, tenantId: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { branch: true },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Remove primary flag from all warehouses in the branch
    await prisma.warehouse.updateMany({
      where: {
        branchId: warehouse.branchId,
        tenantId,
      },
      data: { isPrimary: false },
    });

    // Set primary flag to the selected warehouse
    return prisma.warehouse.update({
      where: { id: warehouseId },
      data: { isPrimary: true },
    });
  }
}
