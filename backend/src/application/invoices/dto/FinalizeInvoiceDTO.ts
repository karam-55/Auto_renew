export class FinalizeInvoiceDTO {
  constructor(public readonly invoiceId: string) {}

  static fromRequest(body: any): FinalizeInvoiceDTO {
    return new FinalizeInvoiceDTO(body.invoiceId);
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.invoiceId) {
      errors.push('Invoice ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
