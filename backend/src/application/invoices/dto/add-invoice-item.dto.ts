export class AddInvoiceItemDto {
  constructor(
    public readonly invoiceId: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly priceSYP: number,
    public readonly priceUSD?: number,
    public readonly partId?: string
  ) {}

  static fromRequest(body: any): AddInvoiceItemDto {
    return new AddInvoiceItemDto(
      body.invoiceId,
      body.description,
      body.quantity,
      body.priceSYP,
      body.priceUSD,
      body.partId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.invoiceId) {
      errors.push('Invoice ID is required');
    }

    if (!this.description) {
      errors.push('Description is required');
    }

    if (!this.quantity) {
      errors.push('Quantity is required');
    }

    if (this.quantity && this.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (!this.priceSYP) {
      errors.push('Price SYP is required');
    }

    if (this.priceSYP && this.priceSYP < 0) {
      errors.push('Price SYP must be positive');
    }

    if (this.priceUSD && this.priceUSD < 0) {
      errors.push('Price USD must be positive');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
