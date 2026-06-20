import { BookingTrackingRepository } from '../interfaces/BookingTrackingRepository';

export class GetBookingTrackingInfo {
  constructor(private readonly repository: BookingTrackingRepository) {}

  async execute(publicToken: string): Promise<any> {
    const booking = await this.repository.findBookingByPublicToken(publicToken);

    if (!booking) {
      throw new Error('Booking not found');
    }

    return {
      booking: {
        id: booking.id,
        status: booking.status,
        publicToken: booking.publicToken,
        notes: booking.notes,
        estimatedCompletionDate: booking.estimatedCompletionDate,
        actualCompletionDate: booking.actualCompletionDate,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        priority: booking.priority,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
      customer: {
        id: booking.customer.id,
        fullName: booking.customer.fullName,
        phone: booking.customer.phone,
        address: booking.customer.address,
      },
      vehicle: {
        id: booking.vehicle.id,
        make: booking.vehicle.make,
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        licensePlate: booking.vehicle.licensePlate,
        vin: booking.vehicle.vin,
      },
      services: booking.bookingServices.map((bs: any) => ({
        id: bs.id,
        service: {
          id: bs.service.id,
          name: bs.service.name,
          nameAr: bs.service.nameAr,
          nameEn: bs.service.nameEn,
        },
        priceSYP: bs.priceSYP,
        priceUSD: bs.priceUSD,
        notes: bs.notes,
      })),
      invoices: booking.invoices.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalSYP: invoice.totalSYP,
        totalUSD: invoice.totalUSD,
        status: invoice.status,
        paidAmount: invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0),
        createdAt: invoice.createdAt,
      })),
      mechanicAssignments: booking.mechanicAssignments ? {
        id: booking.mechanicAssignments.id,
        status: booking.mechanicAssignments.status,
        mechanic: {
          id: booking.mechanicAssignments.mechanic.id,
          fullName: booking.mechanicAssignments.mechanic.fullName,
          phone: booking.mechanicAssignments.mechanic.phone,
        },
        assignedAt: booking.mechanicAssignments.assignedAt,
      } : null,
      tasks: booking.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        assignedTo: task.assignedTo,
        completedAt: task.completedAt,
      })),
      handoverStatus: booking.status === 'COMPLETED' ? 'READY_FOR_HANDOVER' : 'IN_PROGRESS',
    };
  }
}
