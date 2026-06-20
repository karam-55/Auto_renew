export class UnitPrice {
  constructor(private readonly value: number) {
    if (!this.isValid(value)) {
      throw new Error('Unit price must be positive');
    }
    this.value = value;
  }

  private isValid(price: number): boolean {
    return price > 0;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: UnitPrice): boolean {
    return this.value === other.getValue();
  }

  multiply(quantity: number): number {
    return this.value * quantity;
  }
}
