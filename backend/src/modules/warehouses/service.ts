import prisma from '../../config/database';
import { CreateWarehouseDto, UpdateWarehouseDto, Warehouse } from './types';
import { WarehouseStatus } from '@prisma/client';

export class WarehouseService {
  async createWarehouse(tenantId: string, data: CreateWarehouseDto): Promise<Warehouse> {
    // Check if code already exists in this tenant
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existingWarehouse) {
      throw new Error('Warehouse with this code already exists');
    }

    // If managerId is provided, verify the user exists and belongs to the tenant
    if (data.managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new Error('Manager not found or does not belong to this tenant');
      }
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        managerId: data.managerId,
        capacity: data.capacity,
        status: data.status ?? WarehouseStatus.ACTIVE,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        managerId: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  async getWarehouses(tenantId: string): Promise<Warehouse[]> {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        managerId: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return warehouses;
  }

  async getWarehouseById(id: string, tenantId: string): Promise<Warehouse | null> {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        managerId: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  async updateWarehouse(id: string, tenantId: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    // Check if warehouse exists and belongs to tenant
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
    });

    if (!existingWarehouse) {
      throw new Error('Warehouse not found');
    }

    // If updating code, check if new code is available
    if (data.code && data.code !== existingWarehouse.code) {
      const codeExists = await prisma.warehouse.findFirst({
        where: { tenantId, code: data.code },
      });

      if (codeExists) {
        throw new Error('Warehouse with this code already exists');
      }
    }

    // If managerId is provided, verify the user exists and belongs to the tenant
    if (data.managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new Error('Manager not found or does not belong to this tenant');
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        managerId: data.managerId,
        capacity: data.capacity,
        status: data.status,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        managerId: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  async deleteWarehouse(id: string, tenantId: string): Promise<void> {
    // Check if warehouse exists and belongs to tenant
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
    });

    if (!existingWarehouse) {
      throw new Error('Warehouse not found');
    }

    // Check if warehouse has any inventory transactions
    const transactionsCount = await prisma.inventoryTransaction.count({
      where: { warehouseId: id, tenantId },
    });

    if (transactionsCount > 0) {
      throw new Error('Cannot delete warehouse with existing inventory transactions');
    }

    await prisma.warehouse.delete({
      where: { id },
    });
  }

  async getWarehouseCapacity(tenantId: string, warehouseId: string): Promise<{ warehouseId: string; capacity: number | null; usedCapacity: number }> {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
      select: {
        id: true,
        capacity: true,
      },
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Calculate used capacity based on inventory transactions
    // This is a simplified calculation - you may need to adjust based on your business logic
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: { warehouseId, tenantId },
    });

    let usedCapacity = 0;
    for (const transaction of inventoryTransactions) {
      // Assuming quantity represents units of capacity
      usedCapacity += Math.abs(transaction.quantity);
    }

    return {
      warehouseId: warehouse.id,
      capacity: warehouse.capacity,
      usedCapacity,
    };
  }
}
