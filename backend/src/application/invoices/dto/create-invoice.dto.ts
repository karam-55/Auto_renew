export class CreateInvoiceDto {
  constructor(
    public readonly tenantId: string,
    public readonly subtotalSYP: number,
    public readonly totalSYP: number,
    public readonly customerId?: string,
    public readonly bookingId?: string,
    public readonly invoiceDate?: Date,
    public readonly dueDate?: Date,
    public readonly subtotalUSD?: number,
    public readonly totalUSD?: number,
    public readonly taxSYP?: number,
    public readonly taxUSD?: number,
    public readonly taxRateId?: string,
    public readonly discountSYP?: number,
    public readonly discountUSD?: number,
    public readonly loyaltyPointsEarned?: number,
    public readonly loyaltyPointsRedeemed?: number,
    public readonly notes?: string,
    public readonly installmentPlanId?: string
  ) {}

  static fromRequest(body: any): CreateInvoiceDto {
    return new CreateInvoiceDto(
      body.tenantId,
      body.subtotalSYP,
      body.totalSYP,
      body.customerId,
      body.bookingId,
      body.invoiceDate ? new Date(body.invoiceDate) : undefined,
      body.dueDate ? new Date(body.dueDate) : undefined,
      body.subtotalUSD,
      body.totalUSD,
      body.taxSYP,
      body.taxUSD,
      body.taxRateId,
      body.discountSYP,
      body.discountUSD,
      body.loyaltyPointsEarned,
      body.loyaltyPointsRedeemed,
      body.notes,
      body.installmentPlanId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.subtotalSYP) {
      errors.push('Subtotal SYP is required');
    }

    if (this.subtotalSYP < 0) {
      errors.push('Subtotal SYP must be positive');
    }

    if (!this.totalSYP) {
      errors.push('Total SYP is required');
    }

    if (this.totalSYP < 0) {
      errors.push('Total SYP must be positive');
    }

    if (this.invoiceDate && isNaN(this.invoiceDate.getTime())) {
      errors.push('Invalid invoice date');
    }

    if (this.dueDate && isNaN(this.dueDate.getTime())) {
      errors.push('Invalid due date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
