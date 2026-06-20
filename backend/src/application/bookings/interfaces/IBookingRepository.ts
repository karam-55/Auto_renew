export interface IBookingRepository {
  findById(id: string): Promise<any | null>;
  save(booking: any): Promise<any>;
  update(booking: any): Promise<any>;
  list(tenantId: string): Promise<any[]>;
  findOpenByVehicleId(vehicleId: string): Promise<any | null>;
}
