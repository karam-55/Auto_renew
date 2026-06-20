import { BookingRepository } from '../interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';
import { BookingStatus } from '../../../domain/bookings/entities/BookingStatus';
import { BookingStatusChangedEvent } from '../../../domain/bookings/events/BookingStatusChangedEvent';

export class ChangeStatus {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(
    bookingId: string,
    newStatus: BookingStatus
  ): Promise<{ booking: Booking; event: BookingStatusChangedEvent }> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    const previousStatus = booking.status.getValue();

    const updatedBooking = booking.changeStatus(newStatus);

    await this.bookingRepository.update(updatedBooking);

    const event = new BookingStatusChangedEvent(
      updatedBooking,
      previousStatus,
      newStatus
    );

    return { booking: updatedBooking, event };
  }
}
