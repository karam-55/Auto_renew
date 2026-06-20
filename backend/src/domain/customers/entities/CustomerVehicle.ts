import { PlateNumber } from '../value-objects/PlateNumber';

export class CustomerVehicle {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly tenantId: string,
    public readonly plateNumber: PlateNumber,
    public readonly make: string,
    public readonly model: string,
    public readonly year: number,
    public readonly publicCarId: string,
    public readonly vin?: string,
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
    vin?: string,
    color?: string
  ): CustomerVehicle {
    return new CustomerVehicle(
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

  updateMileage(km: number): CustomerVehicle {
    return new CustomerVehicle(
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
}
