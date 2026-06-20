import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { IncreaseStock } from '../../../application/inventory/use-cases/IncreaseStock';
import { DecreaseStock } from '../../../application/inventory/use-cases/DecreaseStock';
import { AdjustStock } from '../../../application/inventory/use-cases/AdjustStock';
import { GetStockItem } from '../../../application/inventory/use-cases/GetStockItem';
import { ListStockItems } from '../../../application/inventory/use-cases/ListStockItems';
import { PrismaPartRepository } from '../../../infrastructure/inventory/repositories/PrismaPartRepository';
import { PrismaStockMovementRepository } from '../../../infrastructure/inventory/repositories/PrismaStockMovementRepository';
import { PrismaStockItemRepository } from '../../../infrastructure/inventory/repositories/PrismaStockItemRepository';
import { PrismaInventoryAdjustmentRepository } from '../../../infrastructure/inventory/repositories/PrismaInventoryAdjustmentRepository';

export class StockController {
  private increaseStock: IncreaseStock;
  private decreaseStock: DecreaseStock;
  private adjustStock: AdjustStock;
  private getStockItem: GetStockItem;
  private listStockItems: ListStockItems;

  constructor() {
    const partRepository = new PrismaPartRepository();
    const stockMovementRepository = new PrismaStockMovementRepository();
    const stockItemRepository = new PrismaStockItemRepository();
    const inventoryAdjustmentRepository = new PrismaInventoryAdjustmentRepository();

    this.increaseStock = new IncreaseStock(partRepository, stockMovementRepository);
    this.decreaseStock = new DecreaseStock(partRepository, stockMovementRepository);
    this.adjustStock = new AdjustStock(partRepository, inventoryAdjustmentRepository);
    this.getStockItem = new GetStockItem(stockItemRepository);
    this.listStockItems = new ListStockItems(stockItemRepository);
  }

  async increase(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        partId,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes,
      } = req.body;

      const result = await this.increaseStock.execute(
        tenantId,
        partId,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes
      );

      res.status(201).json({
        part: {
          id: result.part.id,
          quantity: result.part.quantity,
        },
        movement: {
          id: result.movement.id,
          reference: result.movement.reference.getValue(),
          type: result.movement.type,
          quantity: result.movement.getQuantityValue(),
          costSYP: result.movement.costSYP,
          costUSD: result.movement.costUSD,
          createdAt: result.movement.createdAt,
        },
      });
    } catch (error) {
      Logger.error('Increase stock error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to increase stock';
      if (errorMessage === 'Part not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to increase stock' });
    }
  }

  async decrease(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        partId,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes,
      } = req.body;

      const result = await this.decreaseStock.execute(
        tenantId,
        partId,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes
      );

      res.status(201).json({
        part: {
          id: result.part.id,
          quantity: result.part.quantity,
        },
        movement: {
          id: result.movement.id,
          reference: result.movement.reference.getValue(),
          type: result.movement.type,
          quantity: result.movement.getQuantityValue(),
          costSYP: result.movement.costSYP,
          costUSD: result.movement.costUSD,
          createdAt: result.movement.createdAt,
        },
      });
    } catch (error) {
      Logger.error('Decrease stock error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to decrease stock';
      if (errorMessage === 'Part not found' || errorMessage === 'Insufficient stock') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to decrease stock' });
    }
  }

  async adjust(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        partId,
        newQuantity,
        reason,
        warehouseId,
        adjustedBy,
      } = req.body;

      const result = await this.adjustStock.execute(
        tenantId,
        partId,
        newQuantity,
        reason,
        warehouseId,
        adjustedBy
      );

      res.status(201).json({
        part: {
          id: result.part.id,
          quantity: result.part.quantity,
        },
        adjustment: {
          id: result.adjustment.id,
          previousQuantity: result.adjustment.previousQuantity.getValue(),
          newQuantity: result.adjustment.newQuantity.getValue(),
          difference: result.adjustment.getDifference(),
          reason: result.adjustment.reason,
          createdAt: result.adjustment.createdAt,
        },
      });
    } catch (error) {
      Logger.error('Adjust stock error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';
      if (errorMessage === 'Part not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stockItem = await this.getStockItem.execute(id);

      res.json({
        id: stockItem.id,
        partId: stockItem.partId,
        warehouseId: stockItem.warehouseId,
        quantity: stockItem.getQuantityValue(),
        createdAt: stockItem.createdAt,
        updatedAt: stockItem.updatedAt,
      });
    } catch (error) {
      Logger.error('Get stock item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get stock item';
      if (errorMessage === 'Stock item not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get stock item' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { partId, warehouseId } = req.query;

      let stockItems;
      if (partId && typeof partId === 'string') {
        stockItems = await this.listStockItems.executeByPart(partId);
      } else if (warehouseId && typeof warehouseId === 'string') {
        stockItems = await this.listStockItems.executeByWarehouse(warehouseId);
      } else {
        res.status(400).json({ error: 'Part ID or Warehouse ID is required' });
        return;
      }

      res.json(
        stockItems.map(item => ({
          id: item.id,
          partId: item.partId,
          warehouseId: item.warehouseId,
          quantity: item.getQuantityValue(),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List stock items error:', error);
      res.status(500).json({ error: 'Failed to list stock items' });
    }
  }
}
