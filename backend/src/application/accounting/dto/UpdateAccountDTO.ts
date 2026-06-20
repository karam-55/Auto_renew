export class UpdateAccountDTO {
  constructor(
    public readonly name?: string,
    public readonly isActive?: boolean
  ) {}

  static fromRequest(body: any): UpdateAccountDTO {
    return new UpdateAccountDTO(
      body.name,
      body.isActive
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.name !== undefined && this.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
