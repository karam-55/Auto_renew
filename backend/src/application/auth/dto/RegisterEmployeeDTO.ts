export class RegisterEmployeeDTO {
  constructor(
    public readonly name: string,
    public readonly phone: string,
    public readonly password: string,
    public readonly role: string
  ) {}

  static fromRequest(body: any): RegisterEmployeeDTO {
    return new RegisterEmployeeDTO(
      body.name,
      body.phone,
      body.password,
      body.role
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

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!this.role || this.role.trim().length === 0) {
      errors.push('Role is required');
    }

    const validRoles = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC'];
    if (this.role && !validRoles.includes(this.role.toUpperCase())) {
      errors.push('Invalid role. Must be one of: OWNER, MANAGER, RECEPTIONIST, MECHANIC');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
