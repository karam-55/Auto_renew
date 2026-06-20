export interface ISupplierAccountRepository {
  getBalance(supplierId: string): Promise<number>;
  getStatement(supplierId: string): Promise<any[]>;
}
