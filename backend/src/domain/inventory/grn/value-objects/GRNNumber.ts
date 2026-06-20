import { randomBytes } from 'crypto';

export class GRNNumber {
  private readonly grnNumberRegex = /^GRN-\d{4}-\d{6}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid GRN number format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(grnNumber: string): boolean {
    return this.grnNumberRegex.test(grnNumber);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GRNNumber): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomSequence(): string {
    // Generate 6 random digits (000000-999999)
    const randomNum = randomBytes(3).readUIntBE(0, 3) % 1000000;
    return String(randomNum).padStart(6, '0');
  }

  static generate(): GRNNumber {
    const year = new Date().getFullYear();
    const sequence = GRNNumber.generateRandomSequence();
    return new GRNNumber(`GRN-${year}-${sequence}`);
  }
}
