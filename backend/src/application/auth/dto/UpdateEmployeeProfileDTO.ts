export class UpdateEmployeeProfileDTO {
  constructor(
    public readonly name: string,
    public readonly phone: string
  ) {}

  static fromRequest(body: any): UpdateEmployeeProfileDTO {
    return new UpdateEmployeeProfileDTO(
      body.name,
      body.phone
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
