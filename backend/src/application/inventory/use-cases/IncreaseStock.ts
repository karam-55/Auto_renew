import { PartRepository } from '../interfaces/PartRepository';
import { StockMovementRepository } from '../interfaces/StockMovementRepository';
import { Part } from '../../../domain/inventory/entities/Part';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { StockIncreasedEvent } from '../../../domain/inventory/events/StockIncreasedEvent';
import { v4 as uuidv4 } from 'uuid';

export class IncreaseStock {
  constructor(
    private readonly partRepository: PartRepository,
    private readonly stockMovementRepository: StockMovementRepository
  ) {}

  async execute(
    tenantId: string,
    partId: string,
    quantity: number,
    costSYP: number,
    costUSD?: number,
    warehouseId?: string,
    notes?: string
  ): Promise<{ part: Part; movement: StockMovement; event: StockIncreasedEvent }> {
    // Get the part
    const part = await this.partRepository.findById(partId);
    if (!part) {
      throw new Error('Part not found');
    }

    // Update part quantity
    const updatedPart = part.updateQuantity(part.quantity + quantity);
    await this.partRepository.update(updatedPart);

    // Create stock movement
    const movementId = uuidv4();
    const movement = StockMovement.create(
      movementId,
      tenantId,
      partId,
      MovementType.IN,
      quantity,
      costSYP,
      warehouseId,
      costUSD,
      notes
    );

    const createdMovement = await this.stockMovementRepository.create(movement);

    // Create event
    const event = new StockIncreasedEvent(createdMovement);

    return { part: updatedPart, movement: createdMovement, event };
  }
}
