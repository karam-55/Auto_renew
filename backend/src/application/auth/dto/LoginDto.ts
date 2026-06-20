export class LoginDto {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly tenantId: string
  ) {}

  static fromRequest(body: any): LoginDto {
    return new LoginDto(
      body.username,
      body.password,
      body.tenantId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.username || this.username.length < 3) {
      errors.push('Username is required');
    }

    if (!this.password || this.password.length < 1) {
      errors.push('Password is required');
    }

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
