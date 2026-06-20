import { BookingService } from '../../../domain/bookings/entities/BookingService';

export interface BookingServiceRepository {
  findById(id: string): Promise<BookingService | null>;
  findByBookingId(bookingId: string): Promise<BookingService[]>;
  findByServiceId(serviceId: string): Promise<BookingService[]>;
  create(bookingService: BookingService): Promise<BookingService>;
  update(bookingService: BookingService): Promise<BookingService>;
  delete(id: string): Promise<void>;
  deleteByBookingId(bookingId: string): Promise<void>;
}
