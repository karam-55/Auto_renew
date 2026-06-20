export class BookingApproval {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly approvedBy: string,
    public readonly approvedAt: Date,
    public readonly notes?: string
  ) {}

  static create(
    id: string,
    bookingId: string,
    approvedBy: string,
    notes?: string
  ): BookingApproval {
    return new BookingApproval(
      id,
      bookingId,
      approvedBy,
      new Date(),
      notes
    );
  }
}
