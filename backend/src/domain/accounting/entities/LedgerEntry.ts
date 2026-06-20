import { Money } from '../value-objects/Money';
import { EntryDate } from '../value-objects/EntryDate';

export class LedgerEntry {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly journalEntryId: string,
    public readonly journalEntryItemId: string,
    public readonly entryDate: EntryDate,
    public readonly description: string,
    public readonly debit: Money,
    public readonly credit: Money,
    public readonly balance: Money,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    accountId: string,
    journalEntryId: string,
    journalEntryItemId: string,
    entryDate: EntryDate,
    description: string,
    debit: number,
    credit: number,
    balance: number
  ): LedgerEntry {
    return new LedgerEntry(
      id,
      tenantId,
      accountId,
      journalEntryId,
      journalEntryItemId,
      entryDate,
      description,
      new Money(debit),
      new Money(credit),
      new Money(balance),
      new Date()
    );
  }

  hasDebit(): boolean {
    return this.debit.isPositive();
  }

  hasCredit(): boolean {
    return this.credit.isPositive();
  }

  getDebitValue(): number {
    return this.debit.getValue();
  }

  getCreditValue(): number {
    return this.credit.getValue();
  }

  getBalanceValue(): number {
    return this.balance.getValue();
  }

  isDebitEntry(): boolean {
    return this.debit.isPositive() && this.credit.isZero();
  }

  isCreditEntry(): boolean {
    return this.credit.isPositive() && this.debit.isZero();
  }
}
