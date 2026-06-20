import { BookingRepository } from '../interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';
import { PublicToken } from '../../../domain/bookings/value-objects/PublicToken';
import { BookingCreatedEvent } from '../../../domain/bookings/events/BookingCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateBooking {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async execute(
    tenantId: string,
    customerId: string,
    vehicleId: string,
    scheduledDate: Date,
    scheduledTime?: string,
    notes?: string,
    priority?: string
  ): Promise<{ booking: Booking; event: BookingCreatedEvent }> {
    // Generate public token
    const publicToken = PublicToken.generate();

    // Create booking entity
    const bookingId = uuidv4();
    const booking = Booking.create(
      bookingId,
      tenantId,
      customerId,
      vehicleId,
      scheduledDate,
      publicToken,
      scheduledTime,
      notes,
      priority
    );

    // Save booking
    const createdBooking = await this.bookingRepository.create(booking);

    // Create event
    const event = new BookingCreatedEvent(createdBooking);

    return { booking: createdBooking, event };
  }
}
