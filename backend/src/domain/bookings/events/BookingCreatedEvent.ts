import { Booking } from '../entities/Booking';

export class BookingCreatedEvent {
  constructor(
    public readonly booking: Booking,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'BookingCreated';
  }

  getPayload(): any {
    return {
      bookingId: this.booking.id,
      tenantId: this.booking.tenantId,
      customerId: this.booking.customerId,
      vehicleId: this.booking.vehicleId,
      status: this.booking.status.getValue(),
      publicToken: this.booking.publicToken.getValue(),
      scheduledDate: this.booking.scheduledDate,
      scheduledTime: this.booking.scheduledTime,
      occurredAt: this.occurredAt,
    };
  }
}
