import { randomBytes } from 'crypto';

export class OrderNumber {
  private readonly orderNumberRegex = /^PO-\d{4}-\d{6}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid order number format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(orderNumber: string): boolean {
    return this.orderNumberRegex.test(orderNumber);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderNumber): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomSequence(): string {
    // Generate 6 random digits (000000-999999)
    const randomNum = randomBytes(3).readUIntBE(0, 3) % 1000000;
    return String(randomNum).padStart(6, '0');
  }

  static generate(): OrderNumber {
    const year = new Date().getFullYear();
    const sequence = OrderNumber.generateRandomSequence();
    return new OrderNumber(`PO-${year}-${sequence}`);
  }
}
