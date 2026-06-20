import { GRN } from '../entities/GRN';

export class StockIncreasedByGRNEvent {
  constructor(
    public readonly grn: GRN,
    public readonly partId: string,
    public readonly quantity: number,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'StockIncreasedByGRN';
  }

  getPayload(): any {
    return {
      grnId: this.grn.id,
      tenantId: this.grn.tenantId,
      grnNumber: this.grn.grnNumber.getValue(),
      purchaseOrderId: this.grn.purchaseOrderId,
      partId: this.partId,
      quantity: this.quantity,
      occurredAt: this.occurredAt,
    };
  }
}
