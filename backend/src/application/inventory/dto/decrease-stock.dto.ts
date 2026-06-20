export class DecreaseStockDto {
  constructor(
    public readonly tenantId: string,
    public readonly partId: string,
    public readonly quantity: number,
    public readonly costSYP: number,
    public readonly costUSD?: number,
    public readonly warehouseId?: string,
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): DecreaseStockDto {
    return new DecreaseStockDto(
      body.tenantId,
      body.partId,
      body.quantity,
      body.costSYP,
      body.costUSD,
      body.warehouseId,
      body.notes
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.partId) {
      errors.push('Part ID is required');
    }

    if (!this.quantity) {
      errors.push('Quantity is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (!this.costSYP) {
      errors.push('Cost SYP is required');
    }

    if (this.costSYP < 0) {
      errors.push('Cost SYP must be positive');
    }

    if (this.costUSD !== undefined && this.costUSD < 0) {
      errors.push('Cost USD must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
