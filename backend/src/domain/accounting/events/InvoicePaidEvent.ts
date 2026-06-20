import { Payment } from '../entities/Payment';

export class InvoicePaidEvent {
  constructor(
    public readonly payment: Payment,
    public readonly invoiceId: string,
    public readonly remainingBalance: number,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'InvoicePaid';
  }

  getPayload(): any {
    return {
      paymentId: this.payment.id,
      tenantId: this.payment.tenantId,
      invoiceId: this.invoiceId,
      amount: this.payment.getAmountValue(),
      paymentDate: this.payment.paymentDate.getValue(),
      method: this.payment.method,
      reference: this.payment.reference,
      remainingBalance: this.remainingBalance,
      occurredAt: this.occurredAt,
    };
  }
}
