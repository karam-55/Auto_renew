export class ChangeEmployeePasswordDTO {
  constructor(
    public readonly oldPassword: string,
    public readonly newPassword: string
  ) {}

  static fromRequest(body: any): ChangeEmployeePasswordDTO {
    return new ChangeEmployeePasswordDTO(
      body.oldPassword,
      body.newPassword
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.oldPassword || this.oldPassword.length === 0) {
      errors.push('Old password is required');
    }

    if (!this.newPassword || this.newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }

    if (this.oldPassword === this.newPassword) {
      errors.push('New password must be different from old password');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
