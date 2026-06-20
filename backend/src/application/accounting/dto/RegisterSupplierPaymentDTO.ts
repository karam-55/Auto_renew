export class RegisterSupplierPaymentDTO {
  constructor(
    public readonly supplierId: string,
    public readonly amount: number,
    public readonly method: string,
    public readonly poId?: string
  ) {}

  static fromRequest(body: any): RegisterSupplierPaymentDTO {
    return new RegisterSupplierPaymentDTO(
      body.supplierId,
      body.amount,
      body.method,
      body.poId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.supplierId) {
      errors.push('Supplier ID is required');
    }

    if (!this.amount || this.amount <= 0) {
      errors.push('Amount must be positive');
    }

    if (!this.method || this.method.trim().length === 0) {
      errors.push('Payment method is required');
    }

    const validMethods = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK'];
    if (this.method && !validMethods.includes(this.method.toUpperCase())) {
      errors.push('Invalid payment method. Must be one of: CASH, BANK_TRANSFER, CARD, CHECK');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
