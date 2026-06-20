export class UpdateInvoiceDto {
  constructor(
    public readonly subtotalSYP?: number,
    public readonly totalSYP?: number,
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
    public readonly dueDate?: Date
  ) {}

  static fromRequest(body: any): UpdateInvoiceDto {
    return new UpdateInvoiceDto(
      body.subtotalSYP,
      body.totalSYP,
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
      body.dueDate ? new Date(body.dueDate) : undefined
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.subtotalSYP !== undefined && this.subtotalSYP < 0) {
      errors.push('Subtotal SYP must be positive');
    }

    if (this.totalSYP !== undefined && this.totalSYP < 0) {
      errors.push('Total SYP must be positive');
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
