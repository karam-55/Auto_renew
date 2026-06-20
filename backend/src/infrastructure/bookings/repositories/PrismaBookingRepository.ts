import { BookingRepository } from '../../../application/bookings/interfaces/BookingRepository';
import { Booking } from '../../../domain/bookings/entities/Booking';
import { PublicToken } from '../../../domain/bookings/value-objects/PublicToken';
import { BookingStatus, BookingStatusValue } from '../../../domain/bookings/entities/BookingStatus';
import prisma from '../../../config/database';

export class PrismaBookingRepository implements BookingRepository {
  async findById(id: string): Promise<Booking | null> {
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return null;
    }

    return this.mapToDomain(booking);
  }

  async findByPublicToken(publicToken: PublicToken): Promise<Booking | null> {
    const booking = await prisma.booking.findUnique({
      where: { publicToken: publicToken.getValue() },
    });

    if (!booking) {
      return null;
    }

    return this.mapToDomain(booking);
  }

  async findByCustomerId(customerId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => this.mapToDomain(b));
  }

  async findByVehicleId(vehicleId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => this.mapToDomain(b));
  }

  async findByTenantId(tenantId: string): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => this.mapToDomain(b));
  }

  async findByStatus(tenantId: string, status: BookingStatus): Promise<Booking[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        status: status as any,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => this.mapToDomain(b));
  }

  async create(booking: Booking): Promise<Booking> {
    const createdBooking = await prisma.booking.create({
      data: {
        id: booking.id,
        tenantId: booking.tenantId,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        status: booking.status.getValue() as any,
        publicToken: booking.publicToken.getValue(),
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });

    return this.mapToDomain(createdBooking);
  }

  async update(booking: Booking): Promise<Booking> {
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: booking.status.getValue() as any,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        priority: booking.priority,
        updatedAt: booking.updatedAt,
      },
    });

    return this.mapToDomain(updatedBooking);
  }

  async delete(id: string): Promise<void> {
    await prisma.booking.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaBooking: any): Booking {
    const publicToken = new PublicToken(prismaBooking.publicToken);
    const status = new BookingStatusValue(prismaBooking.status as BookingStatus);

    return new Booking(
      prismaBooking.id,
      prismaBooking.tenantId,
      prismaBooking.customerId,
      prismaBooking.vehicleId,
      status,
      publicToken,
      prismaBooking.scheduledDate,
      prismaBooking.scheduledTime,
      prismaBooking.notes,
      prismaBooking.estimatedCompletionDate,
      prismaBooking.actualCompletionDate,
      prismaBooking.priority,
      prismaBooking.createdAt,
      prismaBooking.updatedAt
    );
  }
}
