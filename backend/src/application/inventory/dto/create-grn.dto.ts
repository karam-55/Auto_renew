export class CreateGRNDto {
  constructor(
    public readonly tenantId: string,
    public readonly purchaseOrderId: string,
    public readonly supplierId: string,
    public readonly receivedDate: Date,
    public readonly notes?: string
  ) {}

  static fromRequest(body: any): CreateGRNDto {
    return new CreateGRNDto(
      body.tenantId,
      body.purchaseOrderId,
      body.supplierId,
      new Date(body.receivedDate),
      body.notes
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.purchaseOrderId) {
      errors.push('Purchase order ID is required');
    }

    if (!this.supplierId) {
      errors.push('Supplier ID is required');
    }

    if (!this.receivedDate) {
      errors.push('Received date is required');
    }

    if (isNaN(this.receivedDate.getTime())) {
      errors.push('Invalid received date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
