export class AddInvoiceItemDTO {
  constructor(
    public readonly invoiceId: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly unitPrice: number,
    public readonly type: string
  ) {}

  static fromRequest(body: any): AddInvoiceItemDTO {
    return new AddInvoiceItemDTO(
      body.invoiceId,
      body.description,
      body.quantity,
      body.unitPrice,
      body.type
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.invoiceId) {
      errors.push('Invoice ID is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!this.quantity || this.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (!this.unitPrice || this.unitPrice < 0) {
      errors.push('Unit price must be non-negative');
    }

    if (!this.type || this.type.trim().length === 0) {
      errors.push('Type is required');
    }

    const validTypes = ['SERVICE', 'PART', 'LABOR', 'OTHER'];
    if (this.type && !validTypes.includes(this.type.toUpperCase())) {
      errors.push('Invalid type. Must be one of: SERVICE, PART, LABOR, OTHER');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
