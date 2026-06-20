export class VIN {
  private readonly vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;

  constructor(private readonly value: string) {
    if (value && !this.isValid(value)) {
      throw new Error('Invalid VIN format');
    }
    this.value = value ? value.toUpperCase() : '';
  }

  private isValid(vin: string): boolean {
    return this.vinRegex.test(vin);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VIN): boolean {
    return this.value === other.getValue();
  }

  isEmpty(): boolean {
    return !this.value;
  }
}
