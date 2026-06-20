import { VehicleRepository } from '../interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';

export class AssignCustomerToVehicle {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(vehicleId: string, customerId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    await this.vehicleRepository.assignCustomer(vehicleId, customerId);

    const updatedVehicle = vehicle.assignCustomer(customerId);
    return updatedVehicle;
  }
}
