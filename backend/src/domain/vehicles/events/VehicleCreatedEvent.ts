import { Vehicle } from '../entities/Vehicle';

export class VehicleCreatedEvent {
  constructor(
    public readonly vehicle: Vehicle,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'VehicleCreated';
  }

  getPayload(): any {
    return {
      vehicleId: this.vehicle.id,
      customerId: this.vehicle.customerId,
      tenantId: this.vehicle.tenantId,
      make: this.vehicle.make,
      model: this.vehicle.model,
      year: this.vehicle.year,
      licensePlate: this.vehicle.plateNumber.getValue(),
      publicCarId: this.vehicle.publicCarId,
      occurredAt: this.occurredAt,
    };
  }
}
