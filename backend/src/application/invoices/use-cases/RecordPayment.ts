import { PaymentRepository } from '../interfaces/PaymentRepository';
import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Payment } from '../../../domain/invoices/entities/Payment';
import { PaymentMethod } from '../../../domain/invoices/entities/Payment';
import { PaymentReceivedEvent } from '../../../domain/invoices/events/PaymentReceivedEvent';
import { v4 as uuidv4 } from 'uuid';

export class RecordPayment {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository
  ) {}

  async execute(
    tenantId: string,
    invoiceId: string,
    amountSYP: number,
    paymentMethod: PaymentMethod,
    amountUSD?: number,
    paymentDate?: Date,
    reference?: string,
    notes?: string,
    cashRegisterSessionId?: string
  ): Promise<{ payment: Payment; event: PaymentReceivedEvent }> {
    // Create payment entity
    const paymentId = uuidv4();
    const payment = Payment.create(
      paymentId,
      tenantId,
      invoiceId,
      amountSYP,
      paymentMethod,
      amountUSD,
      paymentDate,
      reference,
      notes,
      cashRegisterSessionId
    );

    // Save payment
    const createdPayment = await this.paymentRepository.create(payment);

    // Update invoice paid amount
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (invoice) {
      const updatedInvoice = invoice.recordPayment(amountSYP, amountUSD);
      await this.invoiceRepository.update(updatedInvoice);
    }

    // Create event
    const event = new PaymentReceivedEvent(createdPayment);

    return { payment: createdPayment, event };
  }
}
