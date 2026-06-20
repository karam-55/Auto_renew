import { StockMovementRepository as IStockMovementRepository } from '../../../application/inventory/interfaces/StockMovementRepository';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { MovementReference } from '../../../domain/inventory/value-objects/MovementReference';
import { Quantity } from '../../../domain/inventory/value-objects/Quantity';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class StockMovementRepository implements IStockMovementRepository {
  async findById(id: string): Promise<StockMovement | null> {
    try {
      const prisma = PrismaService.getInstance();
      const movement = await prisma.inventoryTransaction.findUnique({
        where: { id },
      });
      if (!movement) return null;
      return this.mapToDomain(movement);
    } catch (error) {
      throw new DatabaseError('Failed to find stock movement by id', error);
    }
  }

  async findByPartId(partId: string): Promise<StockMovement[]> {
    try {
      const prisma = PrismaService.getInstance();
      const movements = await prisma.inventoryTransaction.findMany({
        where: { partId },
        orderBy: { createdAt: 'desc' },
      });
      return movements.map(m => this.mapToDomain(m));
    } catch (error) {
      throw new DatabaseError('Failed to find stock movements by part', error);
    }
  }

  async findByTenantId(tenantId: string): Promise<StockMovement[]> {
    try {
      const prisma = PrismaService.getInstance();
      const movements = await prisma.inventoryTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      return movements.map(m => this.mapToDomain(m));
    } catch (error) {
      throw new DatabaseError('Failed to find stock movements by tenant', error);
    }
  }

  async findByType(tenantId: string, type: MovementType): Promise<StockMovement[]> {
    try {
      const prisma = PrismaService.getInstance();
      const movements = await prisma.inventoryTransaction.findMany({
        where: {
          tenantId,
          type: type as any,
        },
        orderBy: { createdAt: 'desc' },
      });
      return movements.map(m => this.mapToDomain(m));
    } catch (error) {
      throw new DatabaseError('Failed to find stock movements by type', error);
    }
  }

  async create(movement: StockMovement): Promise<StockMovement> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.inventoryTransaction.create({
        data: {
          id: movement.id,
          tenantId: movement.tenantId,
          partId: movement.partId,
          warehouseId: movement.warehouseId,
          type: movement.type as any,
          quantity: movement.getQuantityValue(),
          costSYP: movement.costSYP,
          reference: movement.reference.getValue(),
          notes: movement.notes,
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      throw new DatabaseError('Failed to create stock movement', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.inventoryTransaction.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete stock movement', error);
    }
  }

  private mapToDomain(data: any): StockMovement {
    return new StockMovement(
      data.id,
      data.tenantId,
      data.partId,
      new MovementReference(data.reference),
      data.type as MovementType,
      new Quantity(data.quantity),
      data.costSYP ? Number(data.costSYP) : 0,
      data.createdAt,
      data.warehouseId,
      data.costUSD ? Number(data.costUSD) : undefined,
      data.notes
    );
  }
}
