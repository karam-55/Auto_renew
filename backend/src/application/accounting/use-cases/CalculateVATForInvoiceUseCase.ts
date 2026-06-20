import { IInvoiceRepository } from '../interfaces/IInvoiceRepository';

export class CalculateVATForInvoiceUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(invoiceId: string): Promise<number> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // VAT is already calculated in the invoice
    return invoice.tax;
  }
}
