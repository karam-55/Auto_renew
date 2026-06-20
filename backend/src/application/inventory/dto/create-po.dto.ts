export class CreatePODto {
  constructor(
    public readonly tenantId: string,
    public readonly supplierId: string,
    public readonly orderDate: Date,
    public readonly totalAmount: number,
    public readonly expectedDeliveryDate?: Date,
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): CreatePODto {
    return new CreatePODto(
      body.tenantId,
      body.supplierId,
      new Date(body.orderDate),
      body.totalAmount,
      body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : undefined,
      body.notes
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.supplierId) {
      errors.push('Supplier ID is required');
    }

    if (!this.orderDate) {
      errors.push('Order date is required');
    }

    if (isNaN(this.orderDate.getTime())) {
      errors.push('Invalid order date');
    }

    if (!this.totalAmount) {
      errors.push('Total amount is required');
    }

    if (this.totalAmount < 0) {
      errors.push('Total amount must be non-negative');
    }

    if (this.expectedDeliveryDate && isNaN(this.expectedDeliveryDate.getTime())) {
      errors.push('Invalid expected delivery date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
