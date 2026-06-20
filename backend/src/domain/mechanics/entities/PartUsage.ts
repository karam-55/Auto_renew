import { PartSource } from './PartSource';

export class PartUsage {
  constructor(
    public readonly id: string,
    public readonly workTaskId: string,
    public readonly partId: string,
    public readonly quantity: number,
    public readonly source: PartSource,
    public readonly unitCost: number,
    public readonly totalCost: number,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    workTaskId: string,
    partId: string,
    quantity: number,
    source: PartSource,
    unitCost: number
  ): PartUsage {
    if (quantity <= 0) {
      throw new Error('PartUsage quantity must be positive');
    }

    const totalCost = quantity * unitCost;
    return new PartUsage(
      id,
      workTaskId,
      partId,
      quantity,
      source,
      unitCost,
      totalCost,
      new Date()
    );
  }

  updateQuantity(newQuantity: number): PartUsage {
    if (newQuantity <= 0) {
      throw new Error('PartUsage quantity must be positive');
    }

    const newTotalCost = newQuantity * this.unitCost;
    return new PartUsage(
      this.id,
      this.workTaskId,
      this.partId,
      newQuantity,
      this.source,
      this.unitCost,
      newTotalCost,
      this.createdAt
    );
  }

  updateUnitCost(newUnitCost: number): PartUsage {
    const newTotalCost = this.quantity * newUnitCost;
    return new PartUsage(
      this.id,
      this.workTaskId,
      this.partId,
      this.quantity,
      this.source,
      newUnitCost,
      newTotalCost,
      this.createdAt
    );
  }

  isFromStock(): boolean {
    return this.source === PartSource.STOCK;
  }

  isCustomerProvided(): boolean {
    return this.source === PartSource.CUSTOMER_PROVIDED;
  }

  shouldDeductFromInventory(): boolean {
    return this.source === PartSource.STOCK;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getTotalCost(): number {
    return this.totalCost;
  }
}
