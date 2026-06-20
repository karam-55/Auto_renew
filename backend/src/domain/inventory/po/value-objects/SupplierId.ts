export class SupplierId {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid supplier ID');
    }
  }

  private isValid(supplierId: string): boolean {
    return !!(supplierId && supplierId.length > 0);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SupplierId): boolean {
    return this.value === other.getValue();
  }
}
