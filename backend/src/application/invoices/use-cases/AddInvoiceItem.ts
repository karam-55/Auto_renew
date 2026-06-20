import { InvoiceItemRepository } from '../interfaces/InvoiceItemRepository';
import { InvoiceItem } from '../../../domain/invoices/entities/InvoiceItem';
import { v4 as uuidv4 } from 'uuid';

export class AddInvoiceItem {
  constructor(private readonly invoiceItemRepository: InvoiceItemRepository) {}

  async execute(
    invoiceId: string,
    description: string,
    quantity: number,
    priceSYP: number,
    priceUSD?: number,
    partId?: string
  ): Promise<InvoiceItem> {
    const invoiceItemId = uuidv4();
    const invoiceItem = InvoiceItem.create(
      invoiceItemId,
      invoiceId,
      description,
      quantity,
      priceSYP,
      priceUSD,
      partId
    );

    return await this.invoiceItemRepository.create(invoiceItem);
  }
}
