export class AccountCode {
  private readonly accountCodeRegex = /^\d{4}-\d{3}$/;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid account code format. Expected format: XXXX-XXX');
    }
    this.value = value.toUpperCase();
  }

  private isValid(accountCode: string): boolean {
    return this.accountCodeRegex.test(accountCode);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountCode): boolean {
    return this.value === other.getValue();
  }

  getMainCategory(): string {
    return this.value.split('-')[0];
  }

  getSubCategory(): string {
    return this.value.split('-')[1];
  }
}
