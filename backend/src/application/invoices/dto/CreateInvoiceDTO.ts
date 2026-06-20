export class CreateInvoiceDTO {
  constructor(public readonly bookingId: string) {}

  static fromRequest(body: any): CreateInvoiceDTO {
    return new CreateInvoiceDTO(body.bookingId);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
