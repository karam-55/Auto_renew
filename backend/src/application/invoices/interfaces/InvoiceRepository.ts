import { Invoice } from '../../../domain/invoices/entities/Invoice';
import { InvoiceNumber } from '../../../domain/invoices/value-objects/InvoiceNumber';
import { InvoiceStatus } from '../../../domain/invoices/entities/Invoice';

export interface InvoiceRepository {
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: InvoiceNumber): Promise<Invoice | null>;
  findByCustomerId(customerId: string): Promise<Invoice[]>;
  findByBookingId(bookingId: string): Promise<Invoice[]>;
  findByTenantId(tenantId: string): Promise<Invoice[]>;
  findByStatus(tenantId: string, status: InvoiceStatus): Promise<Invoice[]>;
  create(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
  delete(id: string): Promise<void>;
}
