import { VehicleRepository } from '../interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';

export class ListVehicles {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(tenantId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findByTenantId(tenantId);
  }

  async executeByCustomer(customerId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findByCustomerId(customerId);
  }
}
