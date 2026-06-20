import { VehicleRepository } from '../interfaces/VehicleRepository';

export class DeleteVehicle {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    await this.vehicleRepository.delete(vehicleId);
  }
}
