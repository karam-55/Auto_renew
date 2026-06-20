import { StockItemRepository } from '../../../application/inventory/interfaces/StockItemRepository';
import { StockItem } from '../../../domain/inventory/entities/StockItem';
import prisma from '../../../config/database';

export class PrismaStockItemRepository implements StockItemRepository {
  async findById(id: string): Promise<StockItem | null> {
    // Stock items are represented by Part.quantity in the current schema
    // This is a placeholder implementation
    const part = await prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      return null;
    }

    return StockItem.create(
      part.id,
      part.id,
      part.quantity
    );
  }

  async findByPartId(partId: string): Promise<StockItem[]> {
    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return [];
    }

    return [
      StockItem.create(
        part.id,
        partId,
        part.quantity
      )
    ];
  }

  async findByWarehouseId(warehouseId: string): Promise<StockItem[]> {
    // Since the current schema doesn't have a separate StockItem model,
    // we'll return parts with their quantities
    const parts = await prisma.part.findMany({
      where: {
        // Filter by parts that have transactions with this warehouse
        inventoryTransactions: {
          some: {
            warehouseId: warehouseId,
          },
        },
      },
    });

    return parts.map(p => StockItem.create(p.id, p.id, p.quantity));
  }

  async create(stockItem: StockItem): Promise<StockItem> {
    // This would create a separate stock item record if the schema supported it
    // For now, this is a placeholder
    return stockItem;
  }

  async update(stockItem: StockItem): Promise<StockItem> {
    // Update the part's quantity
    await prisma.part.update({
      where: { id: stockItem.partId },
      data: {
        quantity: stockItem.getQuantityValue(),
      },
    });

    return stockItem;
  }

  async delete(id: string): Promise<void> {
    // Placeholder - stock items are tied to parts
  }
}
