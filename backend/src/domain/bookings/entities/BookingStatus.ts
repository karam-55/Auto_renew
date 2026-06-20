export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  READY = 'READY',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  NO_INVOICE_REQUIRED = 'NO_INVOICE_REQUIRED',
}

export class BookingStatusValue {
  constructor(private readonly value: BookingStatus) {}

  getValue(): BookingStatus {
    return this.value;
  }

  canTransitionTo(newStatus: BookingStatus): boolean {
    const transitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.NO_INVOICE_REQUIRED],
      [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.NO_INVOICE_REQUIRED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.WAITING_PARTS, BookingStatus.READY, BookingStatus.CANCELLED, BookingStatus.NO_INVOICE_REQUIRED],
      [BookingStatus.WAITING_PARTS]: [BookingStatus.IN_PROGRESS, BookingStatus.READY, BookingStatus.CANCELLED, BookingStatus.NO_INVOICE_REQUIRED],
      [BookingStatus.READY]: [BookingStatus.INVOICED, BookingStatus.DELIVERED, BookingStatus.NO_INVOICE_REQUIRED],
      [BookingStatus.INVOICED]: [BookingStatus.PAID, BookingStatus.CANCELLED],
      [BookingStatus.PAID]: [BookingStatus.DELIVERED, BookingStatus.COMPLETED],
      [BookingStatus.DELIVERED]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.NO_SHOW]: [],
      [BookingStatus.NO_INVOICE_REQUIRED]: [BookingStatus.COMPLETED, BookingStatus.DELIVERED],
    };

    return transitions[this.value].includes(newStatus);
  }

  equals(other: BookingStatusValue): boolean {
    return this.value === other.getValue();
  }
}
