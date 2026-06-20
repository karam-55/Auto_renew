import { CustomerVehicleRepository } from '../interfaces/CustomerVehicleRepository';
import { CustomerVehicle } from '../../../domain/customers/entities/CustomerVehicle';
import { PlateNumber } from '../../../domain/customers/value-objects/PlateNumber';

export class UpdateVehicle {
  constructor(private readonly vehicleRepository: CustomerVehicleRepository) {}

  async execute(
    vehicleId: string,
    make?: string,
    model?: string,
    year?: number,
    licensePlate?: string,
    vin?: string,
    currentKm?: number,
    color?: string,
    notes?: string
  ): Promise<CustomerVehicle> {
    // Get existing vehicle
    const existingVehicle = await this.vehicleRepository.findById(vehicleId);

    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    // Update fields
    const updatedPlateNumber = licensePlate ? new PlateNumber(licensePlate) : existingVehicle.plateNumber;
    const updatedMake = make || existingVehicle.make;
    const updatedModel = model || existingVehicle.model;
    const updatedYear = year || existingVehicle.year;
    const updatedVin = vin !== undefined ? vin : existingVehicle.vin;
    const updatedCurrentKm = currentKm !== undefined ? currentKm : existingVehicle.currentKm;
    const updatedColor = color !== undefined ? color : existingVehicle.color;
    const updatedNotes = notes !== undefined ? notes : existingVehicle.notes;

    const updatedVehicle = new CustomerVehicle(
      existingVehicle.id,
      existingVehicle.customerId,
      existingVehicle.tenantId,
      updatedPlateNumber,
      updatedMake,
      updatedModel,
      updatedYear,
      existingVehicle.publicCarId,
      updatedVin,
      updatedCurrentKm,
      updatedColor,
      updatedNotes,
      existingVehicle.createdAt,
      new Date()
    );

    return await this.vehicleRepository.update(updatedVehicle);
  }
}
