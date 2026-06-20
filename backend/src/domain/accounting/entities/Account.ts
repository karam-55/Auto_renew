import { AccountCode } from '../value-objects/AccountCode';
import { AccountType } from './AccountType';

export class Account {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountCode: AccountCode,
    public readonly name: string,
    public readonly type: AccountType,
    public readonly description?: string,
    public readonly parentId?: string,
    public readonly balance: number = 0,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    accountCode: AccountCode,
    name: string,
    type: AccountType,
    description?: string,
    parentId?: string
  ): Account {
    return new Account(
      id,
      tenantId,
      accountCode,
      name,
      type,
      description,
      parentId,
      0,
      true,
      new Date(),
      new Date()
    );
  }

  updateBalance(newBalance: number): Account {
    return new Account(
      this.id,
      this.tenantId,
      this.accountCode,
      this.name,
      this.type,
      this.description,
      this.parentId,
      newBalance,
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): Account {
    return new Account(
      this.id,
      this.tenantId,
      this.accountCode,
      this.name,
      this.type,
      this.description,
      this.parentId,
      this.balance,
      false,
      this.createdAt,
      new Date()
    );
  }

  activate(): Account {
    return new Account(
      this.id,
      this.tenantId,
      this.accountCode,
      this.name,
      this.type,
      this.description,
      this.parentId,
      this.balance,
      true,
      this.createdAt,
      new Date()
    );
  }

  isAsset(): boolean {
    return this.type === AccountType.ASSET;
  }

  isLiability(): boolean {
    return this.type === AccountType.LIABILITY;
  }

  isEquity(): boolean {
    return this.type === AccountType.EQUITY;
  }

  isRevenue(): boolean {
    return this.type === AccountType.REVENUE;
  }

  isCOGS(): boolean {
    return this.type === AccountType.COGS;
  }

  isExpense(): boolean {
    return this.type === AccountType.COGS || this.type === AccountType.EXPENSE;
  }

  isDebitNormal(): boolean {
    return this.type === AccountType.ASSET || this.type === AccountType.COGS || this.type === AccountType.EXPENSE;
  }

  isCreditNormal(): boolean {
    return this.type === AccountType.LIABILITY || this.type === AccountType.EQUITY || this.type === AccountType.REVENUE;
  }
}
