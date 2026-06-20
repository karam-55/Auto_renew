export class Password {
  private readonly minLength = 8;

  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Password must be at least 8 characters long and contain both letters and numbers');
    }
    this.value = value;
  }

  private isValid(password: string): boolean {
    // Check minimum length
    if (password.length < this.minLength) {
      return false;
    }

    // Check for at least one letter
    const hasLetter = /[a-zA-Z]/.test(password);

    // Check for at least one number
    const hasNumber = /[0-9]/.test(password);

    return hasLetter && hasNumber;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Password): boolean {
    return this.value === other.getValue();
  }
}
