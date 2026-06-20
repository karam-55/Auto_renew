import { InventoryAdjustmentRepository } from '../../../application/inventory/interfaces/InventoryAdjustmentRepository';
import { InventoryAdjustment } from '../../../domain/inventory/entities/InventoryAdjustment';
import prisma from '../../../config/database';

export class PrismaInventoryAdjustmentRepository implements InventoryAdjustmentRepository {
  async findById(id: string): Promise<InventoryAdjustment | null> {
    // Inventory adjustments are not a separate model in the current schema
    // They can be represented as InventoryTransaction with type ADJUSTMENT
    const transaction = await prisma.inventoryTransaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.type !== 'ADJUSTMENT') {
      return null;
    }

    return this.mapToDomain(transaction);
  }

  async findByPartId(partId: string): Promise<InventoryAdjustment[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        partId,
        type: 'ADJUSTMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.mapToDomain(t));
  }

  async findByTenantId(tenantId: string): Promise<InventoryAdjustment[]> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        tenantId,
        type: 'ADJUSTMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.mapToDomain(t));
  }

  async create(adjustment: InventoryAdjustment): Promise<InventoryAdjustment> {
    // Create as an InventoryTransaction with type ADJUSTMENT
    const createdTransaction = await prisma.inventoryTransaction.create({
      data: {
        id: adjustment.id,
        tenantId: adjustment.tenantId,
        partId: adjustment.partId,
        warehouseId: adjustment.warehouseId,
        type: 'ADJUSTMENT',
        quantity: adjustment.getDifference(),
        costSYP: 0, // Adjustments don't have cost
        reference: `ADJ-${adjustment.id.substring(0, 8)}`,
        notes: adjustment.reason,
        createdAt: adjustment.createdAt,
        updatedAt: adjustment.createdAt,
      },
    });

    return this.mapToDomain(createdTransaction);
  }

  async delete(id: string): Promise<void> {
    await prisma.inventoryTransaction.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaTransaction: any): InventoryAdjustment {
    // For adjustments, we need to infer previous and new quantities
    // This is a simplified mapping - in a real system, you'd store both quantities
    const previousQuantity = Math.max(0, prismaTransaction.quantity - prismaTransaction.quantity);
    const newQuantity = prismaTransaction.quantity;

    return InventoryAdjustment.create(
      prismaTransaction.id,
      prismaTransaction.tenantId,
      prismaTransaction.partId,
      previousQuantity,
      newQuantity,
      prismaTransaction.notes || 'Adjustment',
      prismaTransaction.warehouseId
    );
  }
}
