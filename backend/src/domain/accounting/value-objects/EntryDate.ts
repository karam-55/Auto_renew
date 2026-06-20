export class EntryDate {
  constructor(private readonly value: Date) {
    if (!this.isValid(value)) {
      throw new Error('Invalid entry date');
    }
    this.value = value;
  }

  private isValid(date: Date): boolean {
    return !isNaN(date.getTime());
  }

  getValue(): Date {
    return this.value;
  }

  equals(other: EntryDate): boolean {
    return this.value.getTime() === other.getValue().getTime();
  }

  isBefore(other: EntryDate): boolean {
    return this.value < other.getValue();
  }

  isAfter(other: EntryDate): boolean {
    return this.value > other.getValue();
  }

  isToday(): boolean {
    const today = new Date();
    return (
      this.value.getDate() === today.getDate() &&
      this.value.getMonth() === today.getMonth() &&
      this.value.getFullYear() === today.getFullYear()
    );
  }

  static today(): EntryDate {
    return new EntryDate(new Date());
  }
}
