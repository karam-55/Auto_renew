import { randomBytes } from 'crypto';

export class BookingCode {
  private readonly codeRegex = /^BK-[A-Z0-9]{8}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid booking code format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(code: string): boolean {
    return this.codeRegex.test(code);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: BookingCode): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomPart(): string {
    // Generate 8 random alphanumeric characters (A-Z, 0-9)
    const bytes = randomBytes(8);
    let result = '';
    for (let i = 0; i < 8; i++) {
      const byte = bytes[i] % 36;
      result += byte < 10 ? String(byte) : String.fromCharCode(65 + (byte - 10));
    }
    return result;
  }

  static generate(): BookingCode {
    const randomPart = BookingCode.generateRandomPart();
    return new BookingCode(`BK-${randomPart}`);
  }
}
