import { InventoryTransfer, TransferStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class InventoryTransferService {
  async createTransfer(data: {
    tenantId: string;
    branchId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    items: Array<{ partId: string; quantity: number }>;
    notes?: string;
  }): Promise<InventoryTransfer> {
    // Validate warehouses
    const fromWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.fromWarehouseId },
      include: { branch: true },
    });

    const toWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.toWarehouseId },
      include: { branch: true },
    });

    if (!fromWarehouse || !toWarehouse) {
      throw new Error('Warehouse not found');
    }

    if (fromWarehouse.branchId !== data.branchId) {
      throw new Error('Source warehouse must belong to the requesting branch');
    }

    // Check stock availability
    for (const item of data.items) {
      const stock = await this.getWarehouseStock(data.fromWarehouseId, item.partId);
      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for part ${item.partId}`);
      }
    }

    // Create transfer
    return prisma.inventoryTransfer.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        status: TransferStatus.REQUESTED,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({ ...item, tenantId: data.tenantId })),
        },
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async getTransferById(id: string, tenantId: string): Promise<InventoryTransfer | null> {
    return prisma.inventoryTransfer.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
        branch: true,
      },
    });
  }

  async getAllTransfers(tenantId: string, branchId?: string, status?: TransferStatus): Promise<InventoryTransfer[]> {
    return prisma.inventoryTransfer.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        ...(status && { status }),
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveTransfer(id: string, tenantId: string): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== TransferStatus.REQUESTED) {
      throw new Error('Transfer can only be approved when in REQUESTED status');
    }

    return prisma.inventoryTransfer.update({
      where: { id },
      data: { status: TransferStatus.APPROVED },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async shipTransfer(id: string, tenantId: string): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new Error('Transfer can only be shipped when in APPROVED status');
    }

    // Reduce stock from source warehouse
    for (const item of transfer.items) {
      await prisma.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: transfer.branchId,
          partId: item.partId,
          warehouseId: transfer.fromWarehouseId,
          type: 'TRANSFER',
          quantity: -item.quantity,
          costSYP: 0,
          reference: `Transfer OUT: ${id}`,
        },
      });
    }

    return prisma.inventoryTransfer.update({
      where: { id },
      data: { status: TransferStatus.SHIPPED },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async receiveTransfer(id: string, tenantId: string): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== TransferStatus.SHIPPED) {
      throw new Error('Transfer can only be received when in SHIPPED status');
    }

    // Increase stock in destination warehouse
    for (const item of transfer.items) {
      await prisma.inventoryTransaction.create({
        data: {
          tenantId,
          branchId: transfer.branchId,
          partId: item.partId,
          warehouseId: transfer.toWarehouseId,
          type: 'TRANSFER',
          quantity: item.quantity,
          costSYP: 0,
          reference: `Transfer IN: ${id}`,
        },
      });
    }

    return prisma.inventoryTransfer.update({
      where: { id },
      data: { status: TransferStatus.RECEIVED },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async cancelTransfer(id: string, tenantId: string): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === TransferStatus.SHIPPED || transfer.status === TransferStatus.RECEIVED) {
      throw new Error('Cannot cancel shipped or received transfers');
    }

    return prisma.inventoryTransfer.update({
      where: { id },
      data: { status: TransferStatus.CANCELLED },
      include: {
        items: {
          include: {
            part: true,
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  private async getWarehouseStock(warehouseId: string, partId: string): Promise<number> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        warehouseId,
        partId,
      },
    });

    return transactions.reduce((total, transaction) => {
      // TRANSFER transactions can be positive (IN) or negative (OUT)
      // Other types like PURCHASE, SALE, etc. have their own logic
      return total + transaction.quantity;
    }, 0);
  }
}
