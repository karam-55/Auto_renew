export class Quantity {
  constructor(private readonly value: number) {
    if (!this.isValid(value)) {
      throw new Error('Quantity must be non-negative');
    }
    this.value = value;
  }

  private isValid(quantity: number): boolean {
    return quantity >= 0;
  }

  getValue(): number {
    return this.value;
  }

  equals(other: Quantity): boolean {
    return this.value === other.getValue();
  }

  add(amount: number): Quantity {
    return new Quantity(this.value + amount);
  }

  subtract(amount: number): Quantity {
    const newValue = this.value - amount;
    if (newValue < 0) {
      throw new Error('Cannot subtract more than current quantity');
    }
    return new Quantity(newValue);
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }
}
