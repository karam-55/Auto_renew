export class NotFoundError extends Error {
  constructor(message: string, public readonly resource?: string, public readonly resourceId?: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
