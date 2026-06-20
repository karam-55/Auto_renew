import { CustomerVehicle } from '../../../domain/customers/entities/CustomerVehicle';
import { PlateNumber } from '../../../domain/customers/value-objects/PlateNumber';

export interface CustomerVehicleRepository {
  findById(id: string): Promise<CustomerVehicle | null>;
  findByCustomerId(customerId: string): Promise<CustomerVehicle[]>;
  findByPublicCarId(publicCarId: string): Promise<CustomerVehicle | null>;
  findByPlateNumber(plateNumber: PlateNumber, tenantId: string): Promise<CustomerVehicle | null>;
  create(vehicle: CustomerVehicle): Promise<CustomerVehicle>;
  update(vehicle: CustomerVehicle): Promise<CustomerVehicle>;
  delete(id: string): Promise<void>;
}
