import { StockMovement } from '../entities/StockMovement';

export class StockDecreasedEvent {
  constructor(
    public readonly movement: StockMovement,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'StockDecreased';
  }

  getPayload(): any {
    return {
      movementId: this.movement.id,
      tenantId: this.movement.tenantId,
      partId: this.movement.partId,
      warehouseId: this.movement.warehouseId,
      reference: this.movement.reference.getValue(),
      quantity: this.movement.getQuantityValue(),
      costSYP: this.movement.costSYP,
      costUSD: this.movement.costUSD,
      occurredAt: this.occurredAt,
    };
  }
}
