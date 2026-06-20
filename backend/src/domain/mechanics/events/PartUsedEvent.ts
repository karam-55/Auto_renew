import { PartUsage } from '../entities/PartUsage';

export class PartUsedEvent {
  constructor(
    public readonly partUsage: PartUsage,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'PartUsed';
  }

  getPayload(): any {
    return {
      partUsageId: this.partUsage.id,
      workTaskId: this.partUsage.workTaskId,
      partId: this.partUsage.partId,
      quantity: this.partUsage.getQuantity(),
      source: this.partUsage.source,
      unitCost: this.partUsage.unitCost,
      totalCost: this.partUsage.getTotalCost(),
      shouldDeductFromInventory: this.partUsage.shouldDeductFromInventory(),
      occurredAt: this.occurredAt,
    };
  }
}
