export class TaskDescription {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Task description is required and must not be empty');
    }
    this.value = value.trim();
  }

  private isValid(description: string): boolean {
    return !!(description && description.trim().length > 0);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TaskDescription): boolean {
    return this.value === other.getValue();
  }

  getLength(): number {
    return this.value.length;
  }

  contains(keyword: string): boolean {
    return this.value.toLowerCase().includes(keyword.toLowerCase());
  }
}
