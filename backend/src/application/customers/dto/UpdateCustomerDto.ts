export class UpdateCustomerDto {
  constructor(
    public readonly fullName?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly notes?: string,
    public readonly city?: string,
    public readonly isVip?: boolean
  ) {}

  static fromRequest(body: any): UpdateCustomerDto {
    return new UpdateCustomerDto(
      body.fullName,
      body.phone,
      body.address,
      body.notes,
      body.city,
      body.isVip
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.phone && !/^[0-9]{10,15}$/.test(this.phone)) {
      errors.push('Phone number must be 10-15 digits');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
