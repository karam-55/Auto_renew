import { Quantity } from '../value-objects/Quantity';

export class InventoryAdjustment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly partId: string,
    public readonly previousQuantity: Quantity,
    public readonly newQuantity: Quantity,
    public readonly reason: string,
    public readonly createdAt: Date = new Date(),
    public readonly warehouseId?: string,
    public readonly adjustedBy?: string
  ) {}

  static create(
    id: string,
    tenantId: string,
    partId: string,
    previousQuantity: number,
    newQuantity: number,
    reason: string,
    warehouseId?: string,
    adjustedBy?: string
  ): InventoryAdjustment {
    return new InventoryAdjustment(
      id,
      tenantId,
      partId,
      new Quantity(previousQuantity),
      new Quantity(newQuantity),
      reason,
      new Date(),
      warehouseId,
      adjustedBy
    );
  }

  getDifference(): number {
    return this.newQuantity.getValue() - this.previousQuantity.getValue();
  }

  isIncrease(): boolean {
    return this.getDifference() > 0;
  }

  isDecrease(): boolean {
    return this.getDifference() < 0;
  }

  isNoChange(): boolean {
    return this.getDifference() === 0;
  }
}
