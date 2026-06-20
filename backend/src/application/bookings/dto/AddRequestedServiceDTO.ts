export class AddRequestedServiceDTO {
  constructor(
    public readonly bookingId: string,
    public readonly serviceId: string,
    public readonly quantity: number
  ) {}

  static fromRequest(body: any): AddRequestedServiceDTO {
    return new AddRequestedServiceDTO(
      body.bookingId,
      body.serviceId,
      body.quantity
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }

    if (!this.serviceId) {
      errors.push('Service ID is required');
    }

    if (!this.quantity || this.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
