import { randomBytes } from 'crypto';

export class PartNumber {
  private readonly partNumberRegex = /^PRT-\d{4}-[A-Z0-9]{6}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid part number format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(partNumber: string): boolean {
    return this.partNumberRegex.test(partNumber);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PartNumber): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomPart(): string {
    // Generate 6 random alphanumeric characters (A-Z, 0-9)
    const bytes = randomBytes(6);
    let result = '';
    for (let i = 0; i < 6; i++) {
      const byte = bytes[i] % 36;
      result += byte < 10 ? String(byte) : String.fromCharCode(65 + (byte - 10));
    }
    return result;
  }

  static generate(): PartNumber {
    const year = new Date().getFullYear();
    const randomPart = PartNumber.generateRandomPart();
    return new PartNumber(`PRT-${year}-${randomPart}`);
  }
}
