export interface IGRNRepository {
  findById(id: string): Promise<any | null>;
}
