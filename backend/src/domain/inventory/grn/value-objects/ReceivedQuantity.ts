export class ReceivedQuantity {
  constructor(private readonly value: number) {
    if (!this.isValid(value)) {
      throw new Error('Received quantity must be non-negative');
    }
    this.value = value;
  }

  private isValid(quantity: number): boolean {
    return quantity >= 0;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: ReceivedQuantity): boolean {
    return this.value === other.getValue();
  }

  canExceed(maxQuantity: number): boolean {
    return this.value > maxQuantity;
  }
}
