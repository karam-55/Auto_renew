import { CustomerVehicleRepository } from '../interfaces/CustomerVehicleRepository';

export class DeleteVehicle {
  constructor(private readonly vehicleRepository: CustomerVehicleRepository) {}

  async execute(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    await this.vehicleRepository.delete(vehicleId);
  }
}
