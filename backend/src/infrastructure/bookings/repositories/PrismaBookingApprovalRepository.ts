import { BookingApprovalRepository } from '../../../application/bookings/interfaces/BookingApprovalRepository';
import { BookingApproval } from '../../../domain/bookings/entities/BookingApproval';
import prisma from '../../../config/database';

export class PrismaBookingApprovalRepository implements BookingApprovalRepository {
  async findById(id: string): Promise<BookingApproval | null> {
    // BookingApproval doesn't exist as a separate model in Prisma schema
    // Approval info might be stored in Booking or a related model
    return null;
  }

  async findByBookingId(bookingId: string): Promise<BookingApproval | null> {
    // Placeholder
    return null;
  }

  async create(bookingApproval: BookingApproval): Promise<BookingApproval> {
    // Placeholder
    return bookingApproval;
  }

  async delete(id: string): Promise<void> {
    // Placeholder
  }

  async deleteByBookingId(bookingId: string): Promise<void> {
    // Placeholder
  }
}
