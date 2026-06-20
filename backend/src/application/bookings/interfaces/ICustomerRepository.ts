export interface ICustomerRepository {
  findById(id: string): Promise<any | null>;
}
