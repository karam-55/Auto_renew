export class AddPOItemDto {
  constructor(
    public readonly purchaseOrderId: string,
    public readonly partId: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly unitPrice: number
  ) {}

  static fromRequest(body: any): AddPOItemDto {
    return new AddPOItemDto(
      body.purchaseOrderId,
      body.partId,
      body.description,
      body.quantity,
      body.unitPrice
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.purchaseOrderId) {
      errors.push('Purchase order ID is required');
    }

    if (!this.partId) {
      errors.push('Part ID is required');
    }

    if (!this.description) {
      errors.push('Description is required');
    }

    if (!this.quantity) {
      errors.push('Quantity is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be positive');
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
