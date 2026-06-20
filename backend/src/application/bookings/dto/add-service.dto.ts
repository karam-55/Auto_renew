export class AddServiceDto {
  constructor(
    public readonly bookingId: string,
    public readonly serviceId: string,
    public readonly priceSYP: number,
    public readonly priceUSD?: number,
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): AddServiceDto {
    return new AddServiceDto(
      body.bookingId,
      body.serviceId,
      body.priceSYP,
      body.priceUSD,
      body.notes
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

    if (!this.priceSYP) {
      errors.push('Price SYP is required');
    }

    if (this.priceSYP && this.priceSYP < 0) {
      errors.push('Price SYP must be positive');
    }

    if (this.priceUSD && this.priceUSD < 0) {
      errors.push('Price USD must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
