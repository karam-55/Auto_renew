import { randomBytes } from 'crypto';

export class PublicToken {
  private readonly tokenRegex = /^[A-Z0-9]{16}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid public token format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(token: string): boolean {
    return this.tokenRegex.test(token);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PublicToken): boolean {
    return this.value === other.getValue();
  }

  static generate(): PublicToken {
    // Generate 12 random bytes = 24 hex chars, then take first 16 and convert to uppercase alphanumeric
    const hex = randomBytes(12).toString('hex').toUpperCase();
    // Convert hex to alphanumeric by replacing non-alphanumeric with random digits
    let result = '';
    for (let i = 0; i < 16; i++) {
      const char = hex[i] || '0';
      const code = char.charCodeAt(0);
      if (code >= 48 && code <= 57) { // 0-9
        result += char;
      } else if (code >= 65 && code <= 70) { // A-F
        result += String.fromCharCode(65 + (code - 65) % 26); // A-Z
      } else {
        result += String.fromCharCode(48 + (randomBytes(1)[0] % 10));
      }
    }
    return new PublicToken(result);
  }
}
