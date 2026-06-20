export class PaymentDTO {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly amount: number,
    public readonly method: string,
    public readonly date: Date,
    public readonly reference: string
  ) {}

  static fromEntity(payment: any): PaymentDTO {
    return new PaymentDTO(
      payment.id,
      payment.type,
      payment.amount,
      payment.method,
      payment.date,
      payment.reference
    );
  }
}
