export class RemoveInvoiceItemDTO {
  constructor(
    public readonly invoiceId: string,
    public readonly itemId: string
  ) {}

  static fromRequest(body: any): RemoveInvoiceItemDTO {
    return new RemoveInvoiceItemDTO(
      body.invoiceId,
      body.itemId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.invoiceId) {
      errors.push('Invoice ID is required');
    }

    if (!this.itemId) {
      errors.push('Item ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
