export class CreateSupplierDTO {
  constructor(
    public readonly name: string,
    public readonly phone: string,
    public readonly address?: string,
    public readonly email?: string,
    public readonly contactPerson?: string
  ) {}

  static fromRequest(body: any): CreateSupplierDTO {
    return new CreateSupplierDTO(
      body.name,
      body.phone,
      body.address,
      body.email,
      body.contactPerson
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('Phone is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
