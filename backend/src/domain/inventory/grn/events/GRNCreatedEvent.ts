import { GRN } from '../entities/GRN';

export class GRNCreatedEvent {
  constructor(
    public readonly grn: GRN,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'GRNCreated';
  }

  getPayload(): any {
    return {
      grnId: this.grn.id,
      tenantId: this.grn.tenantId,
      grnNumber: this.grn.grnNumber.getValue(),
      purchaseOrderId: this.grn.purchaseOrderId,
      supplierId: this.grn.supplierId.getValue(),
      receivedDate: this.grn.receivedDate,
      notes: this.grn.notes,
      isReceived: this.grn.isReceived,
      occurredAt: this.occurredAt,
    };
  }
}
