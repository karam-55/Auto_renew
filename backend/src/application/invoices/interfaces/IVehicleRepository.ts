export interface IVehicleRepository {
  findById(id: string): Promise<any | null>;
}
