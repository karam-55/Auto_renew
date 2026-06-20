export class UpdateBookingStatusDTO {
  constructor(public readonly status: string) {}

  static fromRequest(body: any): UpdateBookingStatusDTO {
    return new UpdateBookingStatusDTO(body.status);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.status) {
      errors.push('Status is required');
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (this.status && !validStatuses.includes(this.status.toUpperCase())) {
      errors.push('Invalid status. Must be one of: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
