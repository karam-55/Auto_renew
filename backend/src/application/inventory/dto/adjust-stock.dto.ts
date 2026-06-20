export class AdjustStockDto {
  constructor(
    public readonly tenantId: string,
    public readonly partId: string,
    public readonly newQuantity: number,
    public readonly reason: string,
    public readonly warehouseId?: string,
    public readonly adjustedBy?: string
  ) {}

  static fromRequest(body: any): AdjustStockDto {
    return new AdjustStockDto(
      body.tenantId,
      body.partId,
      body.newQuantity,
      body.reason,
      body.warehouseId,
      body.adjustedBy
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

    if (this.newQuantity === undefined || this.newQuantity === null) {
      errors.push('New quantity is required');
    }

    if (this.newQuantity < 0) {
      errors.push('New quantity must be non-negative');
    }

    if (!this.reason) {
      errors.push('Reason is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
