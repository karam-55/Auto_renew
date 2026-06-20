export interface IVehicleRepository {
  findByPlate(plateNumber: string, tenantId: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  save(vehicle: any): Promise<any>;
  update(vehicle: any): Promise<any>;
  listByCustomer(customerId: string): Promise<any[]>;
  listAll(tenantId: string): Promise<any[]>;
}
