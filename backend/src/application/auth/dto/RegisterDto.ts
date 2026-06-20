export class RegisterDto {
  constructor(
    public readonly tenantId: string,
    public readonly fullName: string,
    public readonly username: string,
    public readonly password: string,
    public readonly phone: string,
    public readonly role?: string
  ) {}

  static fromRequest(body: any): RegisterDto {
    return new RegisterDto(
      body.tenantId,
      body.fullName,
      body.username,
      body.password,
      body.phone,
      body.role
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

    if (!this.username) {
      errors.push('Username is required');
    }

    if (!this.password) {
      errors.push('Password is required');
    }

    if (!this.phone) {
      errors.push('Phone is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
