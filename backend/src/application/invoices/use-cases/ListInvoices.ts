import { InvoiceRepository } from '../interfaces/InvoiceRepository';
import { Invoice } from '../../../domain/invoices/entities/Invoice';
import { InvoiceStatus } from '../../../domain/invoices/entities/Invoice';

export class ListInvoices {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(tenantId: string): Promise<Invoice[]> {
    return await this.invoiceRepository.findByTenantId(tenantId);
  }

  async executeByCustomer(customerId: string): Promise<Invoice[]> {
    return await this.invoiceRepository.findByCustomerId(customerId);
  }

  async executeByBooking(bookingId: string): Promise<Invoice[]> {
    return await this.invoiceRepository.findByBookingId(bookingId);
  }

  async executeByStatus(tenantId: string, status: InvoiceStatus): Promise<Invoice[]> {
    return await this.invoiceRepository.findByStatus(tenantId, status);
  }
}
