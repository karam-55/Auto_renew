import { randomBytes } from 'crypto';
import settingsService from '../../../services/settings.service';

export class InvoiceNumber {
  private invoiceRegex: RegExp;

  constructor(private readonly value: string, private readonly prefix: string = 'INV') {
    this.invoiceRegex = new RegExp(`^${prefix}-\\d{4}-\\d{6}$`);
    if (!this.isValid(value)) {
      throw new Error('Invalid invoice number format');
    }
    this.value = value.toUpperCase();
  }

  private isValid(invoiceNumber: string): boolean {
    return this.invoiceRegex.test(invoiceNumber);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: InvoiceNumber): boolean {
    return this.value === other.getValue();
  }

  private static generateRandomSequence(): string {
    // Generate 6 random digits (000000-999999)
    const randomNum = randomBytes(3).readUIntBE(0, 3) % 1000000;
    return String(randomNum).padStart(6, '0');
  }

  static async generate(tenantId: string): Promise<InvoiceNumber> {
    try {
      const settings = await settingsService.getSettings(tenantId);
      const prefix = settings.invoicePrefix || 'INV';
      const year = new Date().getFullYear();
      const randomPart = InvoiceNumber.generateRandomSequence();
      return new InvoiceNumber(`${prefix}-${year}-${randomPart}`, prefix);
    } catch (error) {
      // Fallback if settings not available
      const year = new Date().getFullYear();
      const randomPart = InvoiceNumber.generateRandomSequence();
      return new InvoiceNumber(`INV-${year}-${randomPart}`, 'INV');
    }
  }
}
