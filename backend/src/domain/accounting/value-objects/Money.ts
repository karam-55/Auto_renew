export class Money {
  constructor(private readonly amount: number) {
    if (!this.isValid(amount)) {
      throw new Error('Amount must be non-negative');
    }
    this.amount = amount;
  }

  private isValid(amount: number): boolean {
    return amount >= 0;
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.getValue());
  }

  subtract(other: Money): Money {
    const result = this.amount - other.getValue();
    if (result < 0) {
      throw new Error('Result would be negative');
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor must be non-negative');
    }
    return new Money(this.amount * factor);
  }

  equals(other: Money): boolean {
    return this.amount === other.getValue();
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.getValue();
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.getValue();
  }

  static zero(): Money {
    return new Money(0);
  }
}
