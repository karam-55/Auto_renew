export interface IInvoiceRepository {
  findById(id: string): Promise<any | null>;
  findByBookingId(bookingId: string): Promise<any | null>;
  save(invoice: any): Promise<any>;
  update(invoice: any): Promise<any>;
  list(tenantId: string): Promise<any[]>;
}
