import { PartRepository } from '../interfaces/PartRepository';
import { StockMovementRepository } from '../interfaces/StockMovementRepository';
import { Part } from '../../../domain/inventory/entities/Part';
import { StockMovement } from '../../../domain/inventory/entities/StockMovement';
import { MovementType } from '../../../domain/inventory/entities/StockMovement';
import { StockDecreasedEvent } from '../../../domain/inventory/events/StockDecreasedEvent';
import { v4 as uuidv4 } from 'uuid';

export class DecreaseStock {
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
  ): Promise<{ part: Part; movement: StockMovement; event: StockDecreasedEvent }> {
    // Get the part
    const part = await this.partRepository.findById(partId);
    if (!part) {
      throw new Error('Part not found');
    }

    // Check if there's enough stock
    if (part.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    // Update part quantity
    const updatedPart = part.updateQuantity(part.quantity - quantity);
    await this.partRepository.update(updatedPart);

    // Create stock movement
    const movementId = uuidv4();
    const movement = StockMovement.create(
      movementId,
      tenantId,
      partId,
      MovementType.OUT,
      quantity,
      costSYP,
      warehouseId,
      costUSD,
      notes
    );

    const createdMovement = await this.stockMovementRepository.create(movement);

    // Create event
    const event = new StockDecreasedEvent(createdMovement);

    return { part: updatedPart, movement: createdMovement, event };
  }
}
