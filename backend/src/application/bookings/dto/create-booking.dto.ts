export class CreateBookingDto {
  constructor(
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly vehicleId: string,
    public readonly scheduledDate: Date,
    public readonly scheduledTime?: string,
    public readonly notes?: string,
    public readonly priority?: string
  ) {}

  static fromRequest(body: any): CreateBookingDto {
    return new CreateBookingDto(
      body.tenantId,
      body.customerId,
      body.vehicleId,
      new Date(body.scheduledDate),
      body.scheduledTime,
      body.notes,
      body.priority
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.customerId) {
      errors.push('Customer ID is required');
    }

    if (!this.vehicleId) {
      errors.push('Vehicle ID is required');
    }

    if (!this.scheduledDate) {
      errors.push('Scheduled date is required');
    }

    if (this.scheduledDate && isNaN(this.scheduledDate.getTime())) {
      errors.push('Invalid scheduled date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
