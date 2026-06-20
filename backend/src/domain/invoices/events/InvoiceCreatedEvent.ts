import { Invoice } from '../entities/Invoice';

export class InvoiceCreatedEvent {
  constructor(
    public readonly invoice: Invoice,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'InvoiceCreated';
  }

  getPayload(): any {
    return {
      invoiceId: this.invoice.id,
      tenantId: this.invoice.tenantId,
      customerId: this.invoice.customerId,
      bookingId: this.invoice.bookingId,
      invoiceNumber: this.invoice.invoiceNumber.getValue(),
      totalSYP: this.invoice.totalSYP,
      totalUSD: this.invoice.totalUSD,
      status: this.invoice.status,
      occurredAt: this.occurredAt,
    };
  }
}
