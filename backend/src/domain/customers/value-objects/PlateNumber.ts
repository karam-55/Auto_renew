export class PlateNumber {
  private readonly plateRegex = /^[A-Z0-9-]{5,15}$/i;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid plate number format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(plate: string): boolean {
    return this.plateRegex.test(plate);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PlateNumber): boolean {
    return this.value === other.getValue();
  }
}
