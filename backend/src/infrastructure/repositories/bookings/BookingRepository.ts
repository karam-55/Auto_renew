import { IBookingRepository } from '../../../application/bookings/interfaces/IBookingRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class BookingRepository implements IBookingRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          customer: true,
          vehicle: true,
          bookingServices: {
            include: {
              service: true,
            },
          },
        },
      });
      return booking;
    } catch (error) {
      throw new DatabaseError('Failed to find booking by id', error);
    }
  }

  async save(booking: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.booking.create({
        data: {
          id: booking.id,
          tenantId: booking.tenantId,
          customerId: booking.customerId,
          vehicleId: booking.vehicleId,
          status: booking.status,
          publicToken: booking.publicToken,
          notes: booking.notes,
          estimatedCompletionDate: booking.estimatedCompletionDate,
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          priority: booking.priority,
        },
      });
      return created;
    } catch (error) {
      throw new DatabaseError('Failed to save booking', error);
    }
  }

  async update(booking: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: booking.status,
          notes: booking.notes,
          estimatedCompletionDate: booking.estimatedCompletionDate,
          actualCompletionDate: booking.actualCompletionDate,
          priority: booking.priority,
        },
      });
      return updated;
    } catch (error) {
      throw new DatabaseError('Failed to update booking', error);
    }
  }

  async list(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const bookings = await prisma.booking.findMany({
        where: { tenantId },
        include: {
          customer: true,
          vehicle: true,
          bookingServices: {
            include: {
              service: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return bookings;
    } catch (error) {
      throw new DatabaseError('Failed to list bookings', error);
    }
  }

  async findOpenByVehicleId(vehicleId: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const booking = await prisma.booking.findFirst({
        where: {
          vehicleId,
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return booking;
    } catch (error) {
      throw new DatabaseError('Failed to find open booking by vehicle', error);
    }
  }
}
