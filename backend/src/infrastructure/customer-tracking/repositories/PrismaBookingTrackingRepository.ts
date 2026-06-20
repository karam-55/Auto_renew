import { BookingTrackingRepository } from '../../../application/customer-tracking/interfaces/BookingTrackingRepository';
import prisma from '../../../config/database';

export class PrismaBookingTrackingRepository implements BookingTrackingRepository {
  async findBookingByPublicToken(publicToken: string): Promise<any | null> {
    const booking = await prisma.booking.findUnique({
      where: { publicToken },
      include: {
        customer: true,
        vehicle: true,
        bookingServices: {
          include: {
            service: true,
          },
        },
        invoices: {
          include: {
            payments: true,
          },
        },
        mechanicAssignments: {
          include: {
            mechanic: true,
          },
        },
        tasks: true,
      },
    });

    if (!booking) {
      return null;
    }

    return booking;
  }
}
