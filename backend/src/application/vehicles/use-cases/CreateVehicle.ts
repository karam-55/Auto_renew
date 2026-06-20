import { VehicleRepository } from '../interfaces/VehicleRepository';
import { Vehicle } from '../../../domain/vehicles/entities/Vehicle';
import { PlateNumber } from '../../../domain/vehicles/value-objects/PlateNumber';
import { VIN } from '../../../domain/vehicles/value-objects/VIN';
import { VehicleCreatedEvent } from '../../../domain/vehicles/events/VehicleCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateVehicle {
  constructor(private readonly vehicleRepository: VehicleRepository) {}

  async execute(
    customerId: string,
    tenantId: string,
    make: string,
    model: string,
    year: number,
    licensePlate: string,
    vin?: string,
    color?: string,
    notes?: string
  ): Promise<{ vehicle: Vehicle; event: VehicleCreatedEvent }> {
    const plateNumber = new PlateNumber(licensePlate);
    const vinValue = vin ? new VIN(vin) : undefined;

    // Check if vehicle with same plate exists
    const existingVehicle = await this.vehicleRepository.findByPlateNumber(
      plateNumber,
      tenantId
    );

    if (existingVehicle) {
      throw new Error('Vehicle with this license plate already exists');
    }

    // Generate public car ID
    const publicCarId = `CAR-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create vehicle entity
    const vehicleId = uuidv4();
    const vehicle = Vehicle.create(
      vehicleId,
      customerId,
      tenantId,
      plateNumber,
      make,
      model,
      year,
      publicCarId,
      vinValue,
      color
    );

    // Save vehicle
    const createdVehicle = await this.vehicleRepository.create(vehicle);

    // Create event
    const event = new VehicleCreatedEvent(createdVehicle);

    return { vehicle: createdVehicle, event };
  }
}
