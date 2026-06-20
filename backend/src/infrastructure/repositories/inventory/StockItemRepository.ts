import { StockItemRepository as IStockItemRepository } from '../../../application/inventory/interfaces/StockItemRepository';
import { StockItem } from '../../../domain/inventory/entities/StockItem';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class StockItemRepository implements IStockItemRepository {
  async findById(id: string): Promise<StockItem | null> {
    try {
      const prisma = PrismaService.getInstance();
      const part = await prisma.part.findUnique({
        where: { id },
      });
      if (!part) return null;
      return this.mapToDomain(part);
    } catch (error) {
      throw new DatabaseError('Failed to find stock item by id', error);
    }
  }

  async findByPartId(partId: string): Promise<StockItem[]> {
    try {
      const prisma = PrismaService.getInstance();
      const part = await prisma.part.findUnique({
        where: { id: partId },
      });
      if (!part) return [];
      return [this.mapToDomain(part)];
    } catch (error) {
      throw new DatabaseError('Failed to find stock items by part', error);
    }
  }

  async findByWarehouseId(warehouseId: string): Promise<StockItem[]> {
    try {
      const prisma = PrismaService.getInstance();
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { warehouseId },
        distinct: ['partId'],
      });
      const partIds = transactions.map(t => t.partId);
      const parts = await prisma.part.findMany({
        where: { id: { in: partIds } },
      });
      return parts.map(part => this.mapToDomain(part));
    } catch (error) {
      throw new DatabaseError('Failed to find stock items by warehouse', error);
    }
  }

  async create(stockItem: StockItem): Promise<StockItem> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.part.create({
        data: {
          id: stockItem.id,
          tenantId: 'default',
          partNumber: stockItem.partId,
          name: 'Stock Item',
          costSYP: 0,
          sellingPriceSYP: 0,
          quantity: stockItem.getQuantityValue(),
        },
      });
      return this.mapToDomain(created);
    } catch (error) {
      throw new DatabaseError('Failed to create stock item', error);
    }
  }

  async update(stockItem: StockItem): Promise<StockItem> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.part.update({
        where: { id: stockItem.id },
        data: {
          quantity: stockItem.getQuantityValue(),
        },
      });
      return this.mapToDomain(updated);
    } catch (error) {
      throw new DatabaseError('Failed to update stock item', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.part.delete({
        where: { id },
      });
    } catch (error) {
      throw new DatabaseError('Failed to delete stock item', error);
    }
  }

  private mapToDomain(data: any): StockItem {
    return new StockItem(
      data.id,
      data.id,
      data.quantity,
      data.createdAt,
      data.updatedAt
    );
  }
}
