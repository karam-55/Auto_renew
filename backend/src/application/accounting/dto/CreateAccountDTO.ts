export class CreateAccountDTO {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly type: string,
    public readonly parentId?: string
  ) {}

  static fromRequest(body: any): CreateAccountDTO {
    return new CreateAccountDTO(
      body.code,
      body.name,
      body.type,
      body.parentId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Code is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!this.type || this.type.trim().length === 0) {
      errors.push('Type is required');
    }

    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    if (this.type && !validTypes.includes(this.type.toUpperCase())) {
      errors.push('Invalid type. Must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
