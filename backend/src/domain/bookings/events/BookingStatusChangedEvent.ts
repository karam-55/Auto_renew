import { Booking } from '../entities/Booking';
import { BookingStatus } from '../entities/BookingStatus';

export class BookingStatusChangedEvent {
  constructor(
    public readonly booking: Booking,
    public readonly previousStatus: BookingStatus,
    public readonly newStatus: BookingStatus,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'BookingStatusChanged';
  }

  getPayload(): any {
    return {
      bookingId: this.booking.id,
      tenantId: this.booking.tenantId,
      customerId: this.booking.customerId,
      vehicleId: this.booking.vehicleId,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      publicToken: this.booking.publicToken.getValue(),
      occurredAt: this.occurredAt,
    };
  }
}
