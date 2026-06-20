export interface IStockMovementRepository {
  findById(id: string): Promise<any | null>;
}
