import { Money } from '../value-objects/Money';

export class JournalEntryItem {
  constructor(
    public readonly id: string,
    public readonly journalEntryId: string,
    public readonly accountId: string,
    public readonly description: string,
    public readonly debit: Money,
    public readonly credit: Money,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    journalEntryId: string,
    accountId: string,
    description: string,
    debit: number,
    credit: number
  ): JournalEntryItem {
    return new JournalEntryItem(
      id,
      journalEntryId,
      accountId,
      description,
      new Money(debit),
      new Money(credit)
    );
  }

  updateDebit(newDebit: number): JournalEntryItem {
    return new JournalEntryItem(
      this.id,
      this.journalEntryId,
      this.accountId,
      this.description,
      new Money(newDebit),
      this.credit,
      this.createdAt
    );
  }

  updateCredit(newCredit: number): JournalEntryItem {
    return new JournalEntryItem(
      this.id,
      this.journalEntryId,
      this.accountId,
      this.description,
      this.debit,
      new Money(newCredit),
      this.createdAt
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

  isZero(): boolean {
    return this.debit.isZero() && this.credit.isZero();
  }
}
