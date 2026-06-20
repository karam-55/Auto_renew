import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { RecordStockMovement } from '../../../application/inventory/use-cases/RecordStockMovement';
import { ListMovements } from '../../../application/inventory/use-cases/ListMovements';
import { PrismaStockMovementRepository } from '../../../infrastructure/inventory/repositories/PrismaStockMovementRepository';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';

export class MovementController {
  private recordStockMovement: RecordStockMovement;
  private listMovements: ListMovements;

  constructor() {
    const stockMovementRepository = new PrismaStockMovementRepository();
    this.recordStockMovement = new RecordStockMovement(stockMovementRepository);
    this.listMovements = new ListMovements(stockMovementRepository);
  }

  async record(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        partId,
        type,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes,
      } = req.body;

      const result = await this.recordStockMovement.execute(
        tenantId,
        partId,
        type as MovementType,
        quantity,
        costSYP,
        costUSD,
        warehouseId,
        notes
      );

      res.status(201).json({
        id: result.movement.id,
        tenantId: result.movement.tenantId,
        partId: result.movement.partId,
        warehouseId: result.movement.warehouseId,
        reference: result.movement.reference.getValue(),
        type: result.movement.type,
        quantity: result.movement.getQuantityValue(),
        costSYP: result.movement.costSYP,
        costUSD: result.movement.costUSD,
        notes: result.movement.notes,
        createdAt: result.movement.createdAt,
      });
    } catch (error) {
      Logger.error('Record movement error:', error);
      res.status(500).json({ error: 'Failed to record movement' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, partId, type } = req.query;

      let movements;
      if (partId && typeof partId === 'string') {
        movements = await this.listMovements.executeByPart(partId);
      } else if (type && tenantId && typeof tenantId === 'string') {
        movements = await this.listMovements.executeByType(tenantId, type as MovementType);
      } else if (tenantId && typeof tenantId === 'string') {
        movements = await this.listMovements.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        movements.map(movement => ({
          id: movement.id,
          tenantId: movement.tenantId,
          partId: movement.partId,
          warehouseId: movement.warehouseId,
          reference: movement.reference.getValue(),
          type: movement.type,
          quantity: movement.getQuantityValue(),
          costSYP: movement.costSYP,
          costUSD: movement.costUSD,
          notes: movement.notes,
          createdAt: movement.createdAt,
        }))
      );
    } catch (error) {
      Logger.error('List movements error:', error);
      res.status(500).json({ error: 'Failed to list movements' });
    }
  }
}
