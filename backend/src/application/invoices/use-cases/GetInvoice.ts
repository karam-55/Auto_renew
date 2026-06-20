import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Invoice } from '../../../domain/invoices/entities/Invoice';

export class GetInvoice {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }
}
