import { BookingImage } from '../../../domain/bookings/entities/BookingImage';

export interface BookingImageRepository {
  findById(id: string): Promise<BookingImage | null>;
  findByBookingId(bookingId: string): Promise<BookingImage[]>;
  create(bookingImage: BookingImage): Promise<BookingImage>;
  update(bookingImage: BookingImage): Promise<BookingImage>;
  delete(id: string): Promise<void>;
  deleteByBookingId(bookingId: string): Promise<void>;
}
