export class UpdateSupplierDTO {
  constructor(
    public readonly name?: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly contactPerson?: string
  ) {}

  static fromRequest(body: any): UpdateSupplierDTO {
    return new UpdateSupplierDTO(
      body.name,
      body.phone,
      body.address,
      body.contactPerson
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.name !== undefined && this.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    if (this.phone !== undefined && this.phone.trim().length === 0) {
      errors.push('Phone cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
