export interface ISupplierRepository {
  findById(id: string): Promise<any | null>;
  save(supplier: any): Promise<any>;
  update(supplier: any): Promise<any>;
  list(tenantId: string): Promise<any[]>;
}
