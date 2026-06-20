import { BookingImageRepository } from '../../../application/bookings/interfaces/BookingImageRepository';
import { BookingImage } from '../../../domain/bookings/entities/BookingImage';
import prisma from '../../../config/database';

export class PrismaBookingImageRepository implements BookingImageRepository {
  async findById(id: string): Promise<BookingImage | null> {
    // BookingImage doesn't exist as a separate model in Prisma schema
    // Images are stored in Attachment model
    return null;
  }

  async findByBookingId(bookingId: string): Promise<BookingImage[]> {
    // Placeholder - would need to query Attachment model
    return [];
  }

  async create(bookingImage: BookingImage): Promise<BookingImage> {
    // Placeholder - would need to create Attachment record
    return bookingImage;
  }

  async update(bookingImage: BookingImage): Promise<BookingImage> {
    // Placeholder
    return bookingImage;
  }

  async delete(id: string): Promise<void> {
    // Placeholder
  }

  async deleteByBookingId(bookingId: string): Promise<void> {
    // Placeholder
  }
}
