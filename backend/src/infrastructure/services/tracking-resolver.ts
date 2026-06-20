import { PrismaService } from '../database/prisma.service';
import { NotFoundError } from '../errors/not-found-error';

export interface TrackingInfo {
  bookingId: string;
  publicToken: string;
  status: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  customer: {
    fullName: string;
    phone: string;
  };
  services: Array<{
    name: string;
    priceSYP: number;
  }>;
  invoice: {
    invoiceNumber: string;
    totalSYP: number;
    paidSYP: number;
    status: string;
  } | null;
  workOrder: {
    title: string;
    status: string;
  } | null;
  estimatedCompletionDate: Date | null;
  actualCompletionDate: Date | null;
  createdAt: Date;
}

export class TrackingResolver {
  async resolveByPublicToken(publicToken: string): Promise<TrackingInfo> {
    const prisma = PrismaService.getInstance();
    
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
          where: {
            status: {
              in: ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found', 'Booking', publicToken);
    }

    const trackingInfo: TrackingInfo = {
      bookingId: booking.id,
      publicToken: booking.publicToken,
      status: booking.status,
      vehicle: {
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        licensePlate: booking.vehicle.licensePlate,
      },
      customer: {
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
      },
      services: booking.bookingServices.map(bs => ({
        name: bs.service.nameEn || bs.service.name,
        priceSYP: Number(bs.priceSYP),
      })),
      invoice: booking.invoices[0] ? {
        invoiceNumber: booking.invoices[0].invoiceNumber,
        totalSYP: Number(booking.invoices[0].totalSYP),
        paidSYP: Number(booking.invoices[0].paidSYP),
        status: booking.invoices[0].status,
      } : null,
      workOrder: booking.tasks[0] ? {
        title: booking.tasks[0].title,
        status: booking.tasks[0].status,
      } : null,
      estimatedCompletionDate: booking.estimatedCompletionDate,
      actualCompletionDate: booking.actualCompletionDate,
      createdAt: booking.createdAt,
    };

    return trackingInfo;
  }
}
