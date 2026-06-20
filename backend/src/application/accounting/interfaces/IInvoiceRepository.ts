export interface IInvoiceRepository {
  findById(id: string): Promise<any | null>;
}
