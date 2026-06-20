import { StockMovementRepository } from '../interfaces/StockMovementRepository';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { StockIncreasedEvent } from '../../../domain/inventory/events/StockIncreasedEvent';
import { StockDecreasedEvent } from '../../../domain/inventory/events/StockDecreasedEvent';
import { v4 as uuidv4 } from 'uuid';

export class RecordStockMovement {
  constructor(private readonly stockMovementRepository: StockMovementRepository) {}

  async execute(
    tenantId: string,
    partId: string,
    type: MovementType,
    quantity: number,
    costSYP: number,
    costUSD?: number,
    warehouseId?: string,
    notes?: string
  ): Promise<{ movement: StockMovement; event: StockIncreasedEvent | StockDecreasedEvent }> {
    // Create stock movement
    const movementId = uuidv4();
    const movement = StockMovement.create(
      movementId,
      tenantId,
      partId,
      type,
      quantity,
      costSYP,
      warehouseId,
      costUSD,
      notes
    );

    const createdMovement = await this.stockMovementRepository.create(movement);

    // Create appropriate event based on movement type
    const event = type === MovementType.IN
      ? new StockIncreasedEvent(createdMovement)
      : new StockDecreasedEvent(createdMovement);

    return { movement: createdMovement, event };
  }
}
