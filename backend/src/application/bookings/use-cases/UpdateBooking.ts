import { BookingRepository } from '../interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';

export class UpdateBooking {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(
    bookingId: string,
    scheduledDate?: Date,
    scheduledTime?: string,
    notes?: string,
    estimatedCompletionDate?: Date,
    priority?: string
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    const updatedBooking = booking.updateDetails(
      scheduledDate,
      scheduledTime,
      notes,
      estimatedCompletionDate,
      priority
    );

    return await this.bookingRepository.update(updatedBooking);
  }
}
