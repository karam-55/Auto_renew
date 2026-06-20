export interface IVehicleRepository {
  countByCustomerId(customerId: string): Promise<number>;
}
