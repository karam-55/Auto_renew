export interface IBookingRepository {
  countByVehicleId(vehicleId: string): Promise<number>;
}
