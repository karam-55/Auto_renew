export interface IServiceRepository {
  findById(id: string): Promise<any | null>;
}
