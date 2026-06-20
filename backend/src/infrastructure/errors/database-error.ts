export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
