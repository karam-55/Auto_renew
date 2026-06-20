export interface ISupplierRepository {
  findById(id: string): Promise<any | null>;
}
