export class LoginEmployeeDTO {
  constructor(
    public readonly phone: string,
    public readonly password: string
  ) {}

  static fromRequest(body: any): LoginEmployeeDTO {
    return new LoginEmployeeDTO(
      body.phone,
      body.password
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('Phone is required');
    }

    if (!this.password || this.password.length === 0) {
      errors.push('Password is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
