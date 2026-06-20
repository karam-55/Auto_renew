export interface IWorkOrderRepository {
  findById(id: string): Promise<any | null>;
}
