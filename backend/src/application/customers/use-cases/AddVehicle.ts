import { CustomerVehicleRepository } from '../interfaces/CustomerVehicleRepository';
import { CustomerVehicle } from '../../../domain/customers/entities/CustomerVehicle';
import { PlateNumber } from '../../../domain/customers/value-objects/PlateNumber';
import { v4 as uuidv4 } from 'uuid';

export class AddVehicle {
  constructor(private readonly vehicleRepository: CustomerVehicleRepository) {}

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
  ): Promise<CustomerVehicle> {
    const plateNumber = new PlateNumber(licensePlate);

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
    const vehicle = CustomerVehicle.create(
      vehicleId,
      customerId,
      tenantId,
      plateNumber,
      make,
      model,
      year,
      publicCarId,
      vin,
      color
    );

    return await this.vehicleRepository.create(vehicle);
  }
}
