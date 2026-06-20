import { ReceivedQuantity } from '../value-objects/ReceivedQuantity';

export class GRNItem {
  constructor(
    public readonly id: string,
    public readonly grnId: string,
    public readonly purchaseOrderItemId: string,
    public readonly partId: string,
    public readonly description: string,
    public readonly orderedQuantity: number,
    public readonly receivedQuantity: ReceivedQuantity,
    public readonly unitPrice: number,
    public readonly total: number,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    grnId: string,
    purchaseOrderItemId: string,
    partId: string,
    description: string,
    orderedQuantity: number,
    receivedQuantity: number,
    unitPrice: number
  ): GRNItem {
    const receivedQty = new ReceivedQuantity(receivedQuantity);
    const total = receivedQty.getValue() * unitPrice;
    return new GRNItem(
      id,
      grnId,
      purchaseOrderItemId,
      partId,
      description,
      orderedQuantity,
      receivedQty,
      unitPrice,
      total,
      new Date()
    );
  }

  updateReceivedQuantity(newQuantity: number): GRNItem {
    const receivedQty = new ReceivedQuantity(newQuantity);
    const newTotal = receivedQty.getValue() * this.unitPrice;
    return new GRNItem(
      this.id,
      this.grnId,
      this.purchaseOrderItemId,
      this.partId,
      this.description,
      this.orderedQuantity,
      receivedQty,
      this.unitPrice,
      newTotal,
      this.createdAt
    );
  }

  getReceivedQuantityValue(): number {
    return this.receivedQuantity.getValue();
  }

  isFullyReceived(): boolean {
    return this.receivedQuantity.getValue() >= this.orderedQuantity;
  }

  isPartiallyReceived(): boolean {
    return this.receivedQuantity.getValue() > 0 && this.receivedQuantity.getValue() < this.orderedQuantity;
  }

  exceedsOrderedQuantity(): boolean {
    return this.receivedQuantity.canExceed(this.orderedQuantity);
  }
}
