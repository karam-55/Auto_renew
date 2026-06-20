import { Quantity } from '../value-objects/Quantity';

export class StockItem {
  constructor(
    public readonly id: string,
    public readonly partId: string,
    public readonly quantity: Quantity,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly warehouseId?: string
  ) {}

  static create(
    id: string,
    partId: string,
    quantity: number,
    warehouseId?: string
  ): StockItem {
    return new StockItem(
      id,
      partId,
      new Quantity(quantity),
      new Date(),
      new Date(),
      warehouseId
    );
  }

  increase(amount: number): StockItem {
    return new StockItem(
      this.id,
      this.partId,
      this.quantity.add(amount),
      this.createdAt,
      new Date(),
      this.warehouseId
    );
  }

  decrease(amount: number): StockItem {
    return new StockItem(
      this.id,
      this.partId,
      this.quantity.subtract(amount),
      this.createdAt,
      new Date(),
      this.warehouseId
    );
  }

  setQuantity(newQuantity: number): StockItem {
    return new StockItem(
      this.id,
      this.partId,
      new Quantity(newQuantity),
      this.createdAt,
      new Date(),
      this.warehouseId
    );
  }

  getQuantityValue(): number {
    return this.quantity.getValue();
  }

  isZero(): boolean {
    return this.quantity.isZero();
  }

  isPositive(): boolean {
    return this.quantity.isPositive();
  }
}
