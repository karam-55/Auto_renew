import { Payment } from '../entities/Payment';

export class PaymentReceivedEvent {
  constructor(
    public readonly payment: Payment,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'PaymentReceived';
  }

  getPayload(): any {
    return {
      paymentId: this.payment.id,
      tenantId: this.payment.tenantId,
      invoiceId: this.payment.invoiceId,
      amount: this.payment.getAmountValue(),
      paymentDate: this.payment.paymentDate.getValue(),
      method: this.payment.method,
      reference: this.payment.reference,
      notes: this.payment.notes,
      occurredAt: this.occurredAt,
    };
  }
}
