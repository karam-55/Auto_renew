import { Money } from '../value-objects/Money';
import { EntryDate } from '../value-objects/EntryDate';
import { PaymentMethod } from './PaymentMethod';

export class Payment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly amount: Money,
    public readonly paymentDate: EntryDate,
    public readonly method: PaymentMethod,
    public readonly reference?: string,
    public readonly notes?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    invoiceId: string,
    amount: number,
    paymentDate: Date,
    method: PaymentMethod,
    reference?: string,
    notes?: string
  ): Payment {
    return new Payment(
      id,
      tenantId,
      invoiceId,
      new Money(amount),
      new EntryDate(paymentDate),
      method,
      reference,
      notes,
      new Date()
    );
  }

  updateAmount(newAmount: number): Payment {
    return new Payment(
      this.id,
      this.tenantId,
      this.invoiceId,
      new Money(newAmount),
      this.paymentDate,
      this.method,
      this.reference,
      this.notes,
      this.createdAt
    );
  }

  updateMethod(newMethod: PaymentMethod): Payment {
    return new Payment(
      this.id,
      this.tenantId,
      this.invoiceId,
      this.amount,
      this.paymentDate,
      newMethod,
      this.reference,
      this.notes,
      this.createdAt
    );
  }

  getAmountValue(): number {
    return this.amount.getValue();
  }

  isCash(): boolean {
    return this.method === PaymentMethod.CASH;
  }

  isCard(): boolean {
    return this.method === PaymentMethod.CARD;
  }

  isBankTransfer(): boolean {
    return this.method === PaymentMethod.BANK_TRANSFER;
  }

  canExceedRemainingBalance(remainingBalance: number): boolean {
    return this.amount.getValue() > remainingBalance;
  }
}
