import { PlateNumber } from '../value-objects/PlateNumber';
import { VIN } from '../value-objects/VIN';

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly tenantId: string,
    public readonly plateNumber: PlateNumber,
    public readonly make: string,
    public readonly model: string,
    public readonly year: number,
    public readonly publicCarId: string,
    public readonly vin?: VIN,
    public readonly currentKm?: number,
    public readonly color?: string,
    public readonly notes?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    customerId: string,
    tenantId: string,
    plateNumber: PlateNumber,
    make: string,
    model: string,
    year: number,
    publicCarId: string,
    vin?: VIN,
    color?: string
  ): Vehicle {
    return new Vehicle(
      id,
      customerId,
      tenantId,
      plateNumber,
      make,
      model,
      year,
      publicCarId,
      vin,
      undefined,
      color,
      undefined,
      new Date(),
      new Date()
    );
  }

  updateMileage(km: number): Vehicle {
    return new Vehicle(
      this.id,
      this.customerId,
      this.tenantId,
      this.plateNumber,
      this.make,
      this.model,
      this.year,
      this.publicCarId,
      this.vin,
      km,
      this.color,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  assignCustomer(customerId: string): Vehicle {
    return new Vehicle(
      this.id,
      customerId,
      this.tenantId,
      this.plateNumber,
      this.make,
      this.model,
      this.year,
      this.publicCarId,
      this.vin,
      this.currentKm,
      this.color,
      this.notes,
      this.createdAt,
      new Date()
    );
  }
}
