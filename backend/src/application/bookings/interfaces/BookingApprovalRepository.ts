import { BookingApproval } from '../../../domain/bookings/entities/BookingApproval';

export interface BookingApprovalRepository {
  findById(id: string): Promise<BookingApproval | null>;
  findByBookingId(bookingId: string): Promise<BookingApproval | null>;
  create(bookingApproval: BookingApproval): Promise<BookingApproval>;
  delete(id: string): Promise<void>;
  deleteByBookingId(bookingId: string): Promise<void>;
}
