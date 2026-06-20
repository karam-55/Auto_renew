export class CreateCustomerDto {
  constructor(
    public readonly tenantId: string,
    public readonly fullName: string,
    public readonly phone: string,
    public readonly address?: string,
    public readonly notes?: string,
    public readonly city?: string
  ) {}

  static fromRequest(body: any): CreateCustomerDto {
    return new CreateCustomerDto(
      body.tenantId,
      body.fullName,
      body.phone,
      body.address,
      body.notes,
      body.city
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.fullName) {
      errors.push('Full name is required');
    }

    if (!this.phone) {
      errors.push('Phone is required');
    }

    if (this.phone && !/^[0-9]{10,15}$/.test(this.phone)) {
      errors.push('Phone number must be 10-15 digits');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
