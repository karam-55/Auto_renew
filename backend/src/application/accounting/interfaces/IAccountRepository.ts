export interface IAccountRepository {
  findById(id: string): Promise<any | null>;
  findByCode(code: string): Promise<any | null>;
  save(account: any): Promise<any>;
  update(account: any): Promise<any>;
  list(tenantId: string): Promise<any[]>;
}
