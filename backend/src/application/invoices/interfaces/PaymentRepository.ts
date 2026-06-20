import { Payment } from '../../../domain/invoices/entities/Payment';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findByTenantId(tenantId: string): Promise<Payment[]>;
  create(payment: Payment): Promise<Payment>;
  delete(id: string): Promise<void>;
  deleteByInvoiceId(invoiceId: string): Promise<void>;
}
