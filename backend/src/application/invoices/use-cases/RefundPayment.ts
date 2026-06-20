import { PaymentRepository } from '../interfaces/PaymentRepository';
import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Payment } from '../../../domain/invoices/entities/Payment';

export class RefundPayment {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository
  ) {}

  async execute(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Create refund payment
    const refundPayment = payment.refund();
    const createdRefund = await this.paymentRepository.create(refundPayment);

    // Update invoice paid amount (subtract the refunded amount)
    const invoice = await this.invoiceRepository.findById(payment.invoiceId);
    if (invoice) {
      const updatedInvoice = invoice.recordPayment(-payment.amountSYP, payment.amountUSD ? -payment.amountUSD : undefined);
      await this.invoiceRepository.update(updatedInvoice);
    }

    return createdRefund;
  }
}
