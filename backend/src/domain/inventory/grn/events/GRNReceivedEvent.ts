import { GRN } from '../entities/GRN';

export class GRNReceivedEvent {
  constructor(
    public readonly grn: GRN,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'GRNReceived';
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
      occurredAt: this.occurredAt,
    };
  }
}
