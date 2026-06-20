export class VehicleDTO {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly plateNumber: string,
    public readonly make: string,
    public readonly model: string,
    public readonly year: number,
    public readonly color: string,
    public readonly bookingsCount: number
  ) {}

  static fromEntity(vehicle: any, bookingsCount: number): VehicleDTO {
    return new VehicleDTO(
      vehicle.id,
      vehicle.customerId,
      vehicle.licensePlate,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.color,
      bookingsCount
    );
  }
}
