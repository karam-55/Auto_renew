import { MovementReference } from '../value-objects/MovementReference';
import { Quantity } from '../value-objects/Quantity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export class StockMovement {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly partId: string,
    public readonly reference: MovementReference,
    public readonly type: MovementType,
    public readonly quantity: Quantity,
    public readonly costSYP: number,
    public readonly createdAt: Date = new Date(),
    public readonly warehouseId?: string,
    public readonly costUSD?: number,
    public readonly notes?: string
  ) {}

  static create(
    id: string,
    tenantId: string,
    partId: string,
    type: MovementType,
    quantity: number,
    costSYP: number,
    warehouseId?: string,
    costUSD?: number,
    notes?: string
  ): StockMovement {
    const reference = MovementReference.generate();

    return new StockMovement(
      id,
      tenantId,
      partId,
      reference,
      type,
      new Quantity(quantity),
      costSYP,
      new Date(),
      warehouseId,
      costUSD,
      notes
    );
  }

  static createWithReference(
    id: string,
    tenantId: string,
    partId: string,
    type: MovementType,
    quantity: number,
    costSYP: number,
    reference: MovementReference,
    warehouseId?: string,
    costUSD?: number,
    notes?: string
  ): StockMovement {
    return new StockMovement(
      id,
      tenantId,
      partId,
      reference,
      type,
      new Quantity(quantity),
      costSYP,
      new Date(),
      warehouseId,
      costUSD,
      notes
    );
  }

  getQuantityValue(): number {
    return this.quantity.getValue();
  }

  isInbound(): boolean {
    return this.type === MovementType.IN;
  }

  isOutbound(): boolean {
    return this.type === MovementType.OUT;
  }
}
