export class CreateBookingDTO {
  constructor(
    public readonly customerId: string,
    public readonly vehicleId: string,
    public readonly requestedServices: { serviceId: string; quantity: number }[],
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): CreateBookingDTO {
    return new CreateBookingDTO(
      body.customerId,
      body.vehicleId,
      body.requestedServices || [],
      body.notes
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.customerId) {
      errors.push('Customer ID is required');
    }

    if (!this.vehicleId) {
      errors.push('Vehicle ID is required');
    }

    if (!this.requestedServices || this.requestedServices.length === 0) {
      errors.push('At least one requested service is required');
    }

    if (this.requestedServices) {
      this.requestedServices.forEach((service, index) => {
        if (!service.serviceId) {
          errors.push(`Service ID is required for service at index ${index}`);
        }
        if (!service.quantity || service.quantity <= 0) {
          errors.push(`Quantity must be positive for service at index ${index}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
