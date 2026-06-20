export class AddGRNItemDto {
  constructor(
    public readonly grnId: string,
    public readonly purchaseOrderItemId: string,
    public readonly partId: string,
    public readonly description: string,
    public readonly orderedQuantity: number,
    public readonly receivedQuantity: number,
    public readonly unitPrice: number
  ) {}

  static fromRequest(body: any): AddGRNItemDto {
    return new AddGRNItemDto(
      body.grnId,
      body.purchaseOrderItemId,
      body.partId,
      body.description,
      body.orderedQuantity,
      body.receivedQuantity,
      body.unitPrice
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.grnId) {
      errors.push('GRN ID is required');
    }

    if (!this.purchaseOrderItemId) {
      errors.push('Purchase order item ID is required');
    }

    if (!this.partId) {
      errors.push('Part ID is required');
    }

    if (!this.description) {
      errors.push('Description is required');
    }

    if (!this.orderedQuantity) {
      errors.push('Ordered quantity is required');
    }

    if (this.orderedQuantity <= 0) {
      errors.push('Ordered quantity must be positive');
    }

    if (!this.receivedQuantity) {
      errors.push('Received quantity is required');
    }

    if (this.receivedQuantity < 0) {
      errors.push('Received quantity must be non-negative');
    }

    if (!this.unitPrice) {
      errors.push('Unit price is required');
    }

    if (this.unitPrice <= 0) {
      errors.push('Unit price must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
