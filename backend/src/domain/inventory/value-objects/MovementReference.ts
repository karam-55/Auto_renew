import { randomBytes } from 'crypto';

export class MovementReference {
  private readonly referenceRegex = /^MOV-[A-Z0-9]{12}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid movement reference format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(reference: string): boolean {
    return this.referenceRegex.test(reference);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: MovementReference): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomPart(): string {
    // Generate 12 random alphanumeric characters (A-Z, 0-9)
    const bytes = randomBytes(12);
    let result = '';
    for (let i = 0; i < 12; i++) {
      const byte = bytes[i] % 36;
      result += byte < 10 ? String(byte) : String.fromCharCode(65 + (byte - 10));
    }
    return result;
  }

  static generate(): MovementReference {
    const randomPart = MovementReference.generateRandomPart();
    return new MovementReference(`MOV-${randomPart}`);
  }
}
