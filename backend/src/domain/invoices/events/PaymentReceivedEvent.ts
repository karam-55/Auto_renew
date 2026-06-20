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
      amountSYP: this.payment.amountSYP,
      amountUSD: this.payment.amountUSD,
      paymentMethod: this.payment.paymentMethod,
      reference: this.payment.reference,
      occurredAt: this.occurredAt,
    };
  }
}
