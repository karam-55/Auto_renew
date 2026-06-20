export class BusinessRuleError extends Error {
  constructor(message: string, public readonly ruleName?: string) {
    super(message);
    this.name = 'BusinessRuleError';
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}
