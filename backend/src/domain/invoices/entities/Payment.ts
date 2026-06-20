import { PaymentReference } from '../value-objects/PaymentReference';

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHECK = 'CHECK',
}

export class Payment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly amountSYP: number,
    public readonly paymentDate: Date,
    public readonly paymentMethod: PaymentMethod,
    public readonly createdAt: Date = new Date(),
    public readonly amountUSD?: number,
    public readonly reference?: string,
    public readonly notes?: string,
    public readonly cashRegisterSessionId?: string
  ) {}

  static create(
    id: string,
    tenantId: string,
    invoiceId: string,
    amountSYP: number,
    paymentMethod: PaymentMethod,
    amountUSD?: number,
    paymentDate?: Date,
    reference?: string,
    notes?: string,
    cashRegisterSessionId?: string
  ): Payment {
    return new Payment(
      id,
      tenantId,
      invoiceId,
      amountSYP,
      paymentDate || new Date(),
      paymentMethod,
      new Date(),
      amountUSD,
      reference,
      notes,
      cashRegisterSessionId
    );
  }

  refund(): Payment {
    return new Payment(
      this.id,
      this.tenantId,
      this.invoiceId,
      -this.amountSYP,
      new Date(),
      this.paymentMethod,
      new Date(),
      this.amountUSD ? -this.amountUSD : undefined,
      this.reference,
      `Refund: ${this.notes || ''}`,
      this.cashRegisterSessionId
    );
  }
}
