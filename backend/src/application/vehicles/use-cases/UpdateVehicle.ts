import { VehicleRepository } from '../interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';
import { PlateNumber } from '../../../domain/vehicles/value-objects/PlateNumber';
import { VIN } from '../../../domain/vehicles/value-objects/VIN';

export class UpdateVehicle {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

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
  ): Promise<Vehicle> {
    // Get existing vehicle
    const existingVehicle = await this.vehicleRepository.findById(vehicleId);

    if (!existingVehicle) {
      throw new Error('Vehicle not found');
    }

    // Update fields
    const updatedPlateNumber = licensePlate ? new PlateNumber(licensePlate) : existingVehicle.plateNumber;
    const updatedVin = vin !== undefined ? (vin ? new VIN(vin) : undefined) : existingVehicle.vin;
    const updatedMake = make || existingVehicle.make;
    const updatedModel = model || existingVehicle.model;
    const updatedYear = year || existingVehicle.year;
    const updatedCurrentKm = currentKm !== undefined ? currentKm : existingVehicle.currentKm;
    const updatedColor = color !== undefined ? color : existingVehicle.color;
    const updatedNotes = notes !== undefined ? notes : existingVehicle.notes;

    const updatedVehicle = new Vehicle(
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
