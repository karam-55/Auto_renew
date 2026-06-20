export class RegisterCustomerPaymentDTO {
  constructor(
    public readonly customerId: string,
    public readonly amount: number,
    public readonly method: string,
    public readonly invoiceId?: string
  ) {}

  static fromRequest(body: any): RegisterCustomerPaymentDTO {
    return new RegisterCustomerPaymentDTO(
      body.customerId,
      body.amount,
      body.method,
      body.invoiceId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.customerId) {
      errors.push('Customer ID is required');
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
