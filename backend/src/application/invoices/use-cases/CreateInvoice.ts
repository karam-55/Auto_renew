import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Invoice } from '../../../domain/invoices/entities/Invoice';
import { InvoiceNumber } from '../../../domain/invoices/value-objects/InvoiceNumber';
import { InvoiceCreatedEvent } from '../../../domain/invoices/events/InvoiceCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateInvoice {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(
    tenantId: string,
    subtotalSYP: number,
    totalSYP: number,
    customerId?: string,
    bookingId?: string,
    invoiceDate?: Date,
    dueDate?: Date,
    subtotalUSD?: number,
    totalUSD?: number,
    taxSYP?: number,
    taxUSD?: number,
    taxRateId?: string,
    discountSYP?: number,
    discountUSD?: number,
    loyaltyPointsEarned?: number,
    loyaltyPointsRedeemed?: number,
    notes?: string,
    installmentPlanId?: string
  ): Promise<{ invoice: Invoice; event: InvoiceCreatedEvent }> {
    // Generate invoice number
    const invoiceNumber = await InvoiceNumber.generate(tenantId);

    // Create invoice entity
    const invoiceId = uuidv4();
    const invoice = Invoice.create(
      invoiceId,
      tenantId,
      invoiceNumber,
      subtotalSYP,
      totalSYP,
      customerId,
      bookingId,
      invoiceDate,
      dueDate,
      subtotalUSD,
      totalUSD,
      taxSYP,
      taxUSD,
      taxRateId,
      discountSYP,
      discountUSD,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      notes,
      installmentPlanId
    );

    // Save invoice
    const createdInvoice = await this.invoiceRepository.create(invoice);

    // Create event
    const event = new InvoiceCreatedEvent(createdInvoice);

    return { invoice: createdInvoice, event };
  }
}
