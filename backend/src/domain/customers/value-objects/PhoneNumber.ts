export class PhoneNumber {
  private readonly phoneRegex = /^[0-9]{10,15}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid phone number format');
    }
    this.value = value;
  }

  private isValid(phone: string): boolean {
    return this.phoneRegex.test(phone);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.getValue();
  }
}
