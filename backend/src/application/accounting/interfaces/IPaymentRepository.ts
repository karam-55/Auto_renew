export interface IPaymentRepository {
  findById(id: string): Promise<any | null>;
  save(payment: any): Promise<any>;
  listByCustomer(customerId: string): Promise<any[]>;
  listBySupplier(supplierId: string): Promise<any[]>;
}
