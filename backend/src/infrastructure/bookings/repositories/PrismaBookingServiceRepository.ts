import { BookingServiceRepository } from '../../../application/bookings/interfaces/BookingServiceRepository';
import { BookingService } from '../../../domain/bookings/entities/BookingService';
import prisma from '../../../config/database';

export class PrismaBookingServiceRepository implements BookingServiceRepository {
  async findById(id: string): Promise<BookingService | null> {
    const bookingService = await prisma.bookingService.findUnique({
      where: { id },
    });

    if (!bookingService) {
      return null;
    }

    return this.mapToDomain(bookingService);
  }

  async findByBookingId(bookingId: string): Promise<BookingService[]> {
    const bookingServices = await prisma.bookingService.findMany({
      where: { bookingId },
    });

    return bookingServices.map(bs => this.mapToDomain(bs));
  }

  async findByServiceId(serviceId: string): Promise<BookingService[]> {
    const bookingServices = await prisma.bookingService.findMany({
      where: { serviceId },
    });

    return bookingServices.map(bs => this.mapToDomain(bs));
  }

  async create(bookingService: BookingService): Promise<BookingService> {
    const createdBookingService = await prisma.bookingService.create({
      data: {
        id: bookingService.id,
        bookingId: bookingService.bookingId,
        serviceId: bookingService.serviceId,
        priceSYP: bookingService.priceSYP,
        priceUSD: bookingService.priceUSD,
        notes: bookingService.notes,
        createdAt: bookingService.createdAt,
      },
    });

    return this.mapToDomain(createdBookingService);
  }

  async update(bookingService: BookingService): Promise<BookingService> {
    const updatedBookingService = await prisma.bookingService.update({
      where: { id: bookingService.id },
      data: {
        priceSYP: bookingService.priceSYP,
        priceUSD: bookingService.priceUSD,
        notes: bookingService.notes,
      },
    });

    return this.mapToDomain(updatedBookingService);
  }

  async delete(id: string): Promise<void> {
    await prisma.bookingService.delete({
      where: { id },
    });
  }

  async deleteByBookingId(bookingId: string): Promise<void> {
    await prisma.bookingService.deleteMany({
      where: { bookingId },
    });
  }

  private mapToDomain(prismaBookingService: any): BookingService {
    return new BookingService(
      prismaBookingService.id,
      prismaBookingService.bookingId,
      prismaBookingService.serviceId,
      Number(prismaBookingService.priceSYP),
      prismaBookingService.priceUSD ? Number(prismaBookingService.priceUSD) : undefined,
      prismaBookingService.notes,
      prismaBookingService.createdAt
    );
  }
}
