import { PurchaseOrder } from '../entities/PurchaseOrder';

export class PurchaseOrderSubmittedEvent {
  constructor(
    public readonly purchaseOrder: PurchaseOrder,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'PurchaseOrderSubmitted';
  }

  getPayload(): any {
    return {
      purchaseOrderId: this.purchaseOrder.id,
      tenantId: this.purchaseOrder.tenantId,
      orderNumber: this.purchaseOrder.orderNumber.getValue(),
      supplierId: this.purchaseOrder.supplierId.getValue(),
      status: this.purchaseOrder.status,
      orderDate: this.purchaseOrder.orderDate,
      expectedDeliveryDate: this.purchaseOrder.expectedDeliveryDate,
      totalAmount: this.purchaseOrder.totalAmount,
      notes: this.purchaseOrder.notes,
      occurredAt: this.occurredAt,
    };
  }
}
