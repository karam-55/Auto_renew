import { InvoiceNumber } from '../value-objects/InvoiceNumber';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  ISSUED = 'ISSUED',
}

export class Invoice {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly invoiceNumber: InvoiceNumber,
    public readonly invoiceDate: Date,
    public readonly subtotalSYP: number,
    public readonly taxSYP: number,
    public readonly discountSYP: number,
    public readonly loyaltyPointsEarned: number,
    public readonly loyaltyPointsRedeemed: number,
    public readonly totalSYP: number,
    public readonly paidSYP: number,
    public readonly paidUSD: number,
    public readonly status: InvoiceStatus,
    public readonly customerId?: string,
    public readonly bookingId?: string,
    public readonly dueDate?: Date,
    public readonly subtotalUSD?: number,
    public readonly taxUSD?: number,
    public readonly taxRateId?: string,
    public readonly discountUSD?: number,
    public readonly totalUSD?: number,
    public readonly notes?: string,
    public readonly installmentPlanId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    invoiceNumber: InvoiceNumber,
    subtotalSYP: number,
    totalSYP: number,
    customerId?: string,
    bookingId?: string,
    invoiceDate?: Date,
    dueDate?: Date,
    subtotalUSD?: number,
    totalUSD?: number,
    taxSYP?: number,
    taxUSD?: number,
    taxRateId?: string,
    discountSYP?: number,
    discountUSD?: number,
    loyaltyPointsEarned?: number,
    loyaltyPointsRedeemed?: number,
    notes?: string,
    installmentPlanId?: string
  ): Invoice {
    return new Invoice(
      id,
      tenantId,
      invoiceNumber,
      invoiceDate || new Date(),
      subtotalSYP,
      taxSYP || 0,
      discountSYP || 0,
      loyaltyPointsEarned || 0,
      loyaltyPointsRedeemed || 0,
      totalSYP,
      0,
      0,
      InvoiceStatus.DRAFT,
      customerId,
      bookingId,
      dueDate,
      subtotalUSD,
      taxUSD,
      taxRateId,
      discountUSD,
      totalUSD,
      notes,
      installmentPlanId,
      new Date(),
      new Date()
    );
  }

  updateStatus(status: InvoiceStatus): Invoice {
    // Validate status transitions
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.CANCELLED],
      [InvoiceStatus.ISSUED]: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.SENT]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED],
      [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.PAID]: [],
      [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[this.status] || [];
    if (!allowedTransitions.includes(status)) {
      throw new Error(`Cannot transition from ${this.status} to ${status}`);
    }

    return new Invoice(
      this.id,
      this.tenantId,
      this.invoiceNumber,
      this.invoiceDate,
      this.subtotalSYP,
      this.taxSYP,
      this.discountSYP,
      this.loyaltyPointsEarned,
      this.loyaltyPointsRedeemed,
      this.totalSYP,
      this.paidSYP,
      this.paidUSD,
      status,
      this.customerId,
      this.bookingId,
      this.dueDate,
      this.subtotalUSD,
      this.taxUSD,
      this.taxRateId,
      this.discountUSD,
      this.totalUSD,
      this.notes,
      this.installmentPlanId,
      this.createdAt,
      new Date()
    );
  }

  recordPayment(amountSYP: number, amountUSD?: number): Invoice {
    return new Invoice(
      this.id,
      this.tenantId,
      this.invoiceNumber,
      this.invoiceDate,
      this.subtotalSYP,
      this.taxSYP,
      this.discountSYP,
      this.loyaltyPointsEarned,
      this.loyaltyPointsRedeemed,
      this.totalSYP,
      this.paidSYP + amountSYP,
      this.paidUSD + (amountUSD || 0),
      this.status,
      this.customerId,
      this.bookingId,
      this.dueDate,
      this.subtotalUSD,
      this.taxUSD,
      this.taxRateId,
      this.discountUSD,
      this.totalUSD,
      this.notes,
      this.installmentPlanId,
      this.createdAt,
      new Date()
    );
  }

  getRemainingAmountSYP(): number {
    return this.totalSYP - this.paidSYP;
  }

  getRemainingAmountUSD(): number {
    return (this.totalUSD || 0) - this.paidUSD;
  }

  isFullyPaid(): boolean {
    return this.paidSYP >= this.totalSYP;
  }
}
