import { PaymentMethod } from '../../../domain/invoices/entities/Payment';

export class RecordPaymentDto {
  constructor(
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly amountSYP: number,
    public readonly paymentMethod: PaymentMethod,
    public readonly amountUSD?: number,
    public readonly paymentDate?: Date,
    public readonly reference?: string,
    public readonly notes?: string,
    public readonly cashRegisterSessionId?: string
  ) {}

  static fromRequest(body: any): RecordPaymentDto {
    return new RecordPaymentDto(
      body.tenantId,
      body.invoiceId,
      body.amountSYP,
      body.paymentMethod,
      body.amountUSD,
      body.paymentDate ? new Date(body.paymentDate) : undefined,
      body.reference,
      body.notes,
      body.cashRegisterSessionId
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!this.invoiceId) {
      errors.push('Invoice ID is required');
    }

    if (!this.amountSYP) {
      errors.push('Amount SYP is required');
    }

    if (this.amountSYP && this.amountSYP <= 0) {
      errors.push('Amount SYP must be positive');
    }

    if (this.amountUSD && this.amountUSD <= 0) {
      errors.push('Amount USD must be positive');
    }

    if (!this.paymentMethod) {
      errors.push('Payment method is required');
    }

    if (this.paymentDate && isNaN(this.paymentDate.getTime())) {
      errors.push('Invalid payment date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
