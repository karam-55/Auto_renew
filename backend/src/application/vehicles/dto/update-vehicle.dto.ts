export class UpdateVehicleDto {
  constructor(
    public readonly make?: string,
    public readonly model?: string,
    public readonly year?: number,
    public readonly licensePlate?: string,
    public readonly vin?: string,
    public readonly currentKm?: number,
    public readonly color?: string,
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): UpdateVehicleDto {
    return new UpdateVehicleDto(
      body.make,
      body.model,
      body.year,
      body.licensePlate,
      body.vin,
      body.currentKm,
      body.color,
      body.notes
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.year && (this.year < 1900 || this.year > new Date().getFullYear() + 1)) {
      errors.push('Invalid year');
    }

    if (this.licensePlate && !/^[A-Z0-9-]{5,15}$/i.test(this.licensePlate)) {
      errors.push('License plate must be 5-15 alphanumeric characters');
    }

    if (this.vin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(this.vin)) {
      errors.push('VIN must be 17 alphanumeric characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
