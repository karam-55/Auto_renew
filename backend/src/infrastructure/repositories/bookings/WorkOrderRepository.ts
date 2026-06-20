import { IWorkOrderRepository } from '../../../application/bookings/interfaces/IWorkOrderRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class WorkOrderRepository implements IWorkOrderRepository {
  async createForBooking(bookingId: string): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const workOrder = await prisma.task.create({
        data: {
          bookingId,
          title: `Work Order for Booking ${bookingId}`,
          description: 'Auto-generated work order',
          status: 'PENDING',
          tenantId: booking.tenantId,
          priority: 'MEDIUM',
        },
      });

      return workOrder;
    } catch (error) {
      throw new DatabaseError('Failed to create work order for booking', error);
    }
  }
}
