import { BookingRepository } from '../interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';

export class GetBooking {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }
}
