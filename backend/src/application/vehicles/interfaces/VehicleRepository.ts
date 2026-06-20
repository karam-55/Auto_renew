import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';
import { PlateNumber } from '../../../domain/vehicles/value-objects/PlateNumber';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findByPublicCarId(publicCarId: string): Promise<Vehicle | null>;
  findByPlateNumber(plateNumber: PlateNumber, tenantId: string): Promise<Vehicle | null>;
  findByCustomerId(customerId: string): Promise<Vehicle[]>;
  findByTenantId(tenantId: string): Promise<Vehicle[]>;
  create(vehicle: Vehicle): Promise<Vehicle>;
  update(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<void>;
  assignCustomer(vehicleId: string, customerId: string): Promise<void>;
}
