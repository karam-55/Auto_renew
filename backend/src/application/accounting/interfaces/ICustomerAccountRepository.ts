export interface ICustomerAccountRepository {
  getBalance(customerId: string): Promise<number>;
  getStatement(customerId: string): Promise<any[]>;
}
