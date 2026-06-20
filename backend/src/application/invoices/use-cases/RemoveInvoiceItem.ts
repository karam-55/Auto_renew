import { InvoiceItemRepository } from '../interfaces/InvoiceItemRepository';

export class RemoveInvoiceItem {
  constructor(private readonly invoiceItemRepository: InvoiceItemRepository) {}

  async execute(invoiceItemId: string): Promise<void> {
    const invoiceItem = await this.invoiceItemRepository.findById(invoiceItemId);

    if (!invoiceItem) {
      throw new Error('Invoice item not found');
    }

    await this.invoiceItemRepository.delete(invoiceItemId);
  }
}
