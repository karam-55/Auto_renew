export class Hours {
  constructor(private readonly value: number) {
    if (!this.isValid(value)) {
      throw new Error('Hours must be non-negative');
    }
    this.value = value;
  }

  private isValid(hours: number): boolean {
    return hours >= 0;
  }

  getValue(): number {
    return this.value;
  }

  add(other: Hours): Hours {
    return new Hours(this.value + other.getValue());
  }

  subtract(other: Hours): Hours {
    const result = this.value - other.getValue();
    if (result < 0) {
      throw new Error('Result would be negative');
    }
    return new Hours(result);
  }

  equals(other: Hours): boolean {
    return this.value === other.getValue();
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  isGreaterThan(other: Hours): boolean {
    return this.value > other.getValue();
  }

  isLessThan(other: Hours): boolean {
    return this.value < other.getValue();
  }

  static zero(): Hours {
    return new Hours(0);
  }
}
