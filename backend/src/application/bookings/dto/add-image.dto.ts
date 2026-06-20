export class AddImageDto {
  constructor(
    public readonly bookingId: string,
    public readonly url: string,
    public readonly caption?: string,
    public readonly uploadedBy?: string
  ) {}

  static fromRequest(body: any): AddImageDto {
    return new AddImageDto(
      body.bookingId,
      body.url,
      body.caption,
      body.uploadedBy
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.bookingId) {
      errors.push('Booking ID is required');
    }

    if (!this.url) {
      errors.push('Image URL is required');
    }

    if (this.url && !this.isValidUrl(this.url)) {
      errors.push('Invalid image URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
