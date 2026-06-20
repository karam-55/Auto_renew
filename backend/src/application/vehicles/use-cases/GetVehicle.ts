import { VehicleRepository } from '../interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';

export class GetVehicle {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return vehicle;
  }
}
