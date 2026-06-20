import { UnitPrice } from '../value-objects/UnitPrice';

export class PurchaseOrderItem {
  constructor(
    public readonly id: string,
    public readonly purchaseOrderId: string,
    public readonly partId: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly unitPrice: UnitPrice,
    public readonly total: number,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    purchaseOrderId: string,
    partId: string,
    description: string,
    quantity: number,
    unitPrice: UnitPrice
  ): PurchaseOrderItem {
    const total = unitPrice.multiply(quantity);
    return new PurchaseOrderItem(
      id,
      purchaseOrderId,
      partId,
      description,
      quantity,
      unitPrice,
      total,
      new Date()
    );
  }

  updateQuantity(newQuantity: number): PurchaseOrderItem {
    const newTotal = this.unitPrice.multiply(newQuantity);
    return new PurchaseOrderItem(
      this.id,
      this.purchaseOrderId,
      this.partId,
      this.description,
      newQuantity,
      this.unitPrice,
      newTotal,
      this.createdAt
    );
  }

  updateUnitPrice(newUnitPrice: UnitPrice): PurchaseOrderItem {
    const newTotal = newUnitPrice.multiply(this.quantity);
    return new PurchaseOrderItem(
      this.id,
      this.purchaseOrderId,
      this.partId,
      this.description,
      this.quantity,
      newUnitPrice,
      newTotal,
      this.createdAt
    );
  }

  getUnitPriceValue(): number {
    return this.unitPrice.getValue();
  }
}
