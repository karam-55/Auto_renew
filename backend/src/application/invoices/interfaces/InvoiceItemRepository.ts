import { InvoiceItem } from '../../../domain/invoices/entities/InvoiceItem';

export interface InvoiceItemRepository {
  findById(id: string): Promise<InvoiceItem | null>;
  findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
  create(invoiceItem: InvoiceItem): Promise<InvoiceItem>;
  update(invoiceItem: InvoiceItem): Promise<InvoiceItem>;
  delete(id: string): Promise<void>;
  deleteByInvoiceId(invoiceId: string): Promise<void>;
}
