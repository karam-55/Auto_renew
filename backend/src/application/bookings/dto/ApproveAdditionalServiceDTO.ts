export class ApproveAdditionalServiceDTO {
  constructor(
    public readonly bookingId: string,
    public readonly serviceItemId: string
  ) {}

  static fromRequest(body: any): ApproveAdditionalServiceDTO {
    return new ApproveAdditionalServiceDTO(
      body.bookingId,
      body.serviceItemId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }

    if (!this.serviceItemId) {
      errors.push('Service Item ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
