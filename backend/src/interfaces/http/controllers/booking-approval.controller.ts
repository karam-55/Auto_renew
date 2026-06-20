import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { ApproveBooking } from '../../../application/bookings/use-cases/ApproveBooking';
import { RejectBooking } from '../../../application/bookings/use-cases/RejectBooking';
import { PrismaBookingApprovalRepository } from '../../../infrastructure/bookings/repositories/PrismaBookingApprovalRepository';

export class BookingApprovalController {
  private approveBooking: ApproveBooking;
  private rejectBooking: RejectBooking;

  constructor() {
    const bookingApprovalRepository = new PrismaBookingApprovalRepository();
    this.approveBooking = new ApproveBooking(bookingApprovalRepository);
    this.rejectBooking = new RejectBooking(bookingApprovalRepository);
  }

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { approvedBy, notes } = req.body;

      const approval = await this.approveBooking.execute(
        bookingId,
        approvedBy,
        notes
      );

      res.status(201).json({
        id: approval.id,
        bookingId: approval.bookingId,
        approvedBy: approval.approvedBy,
        approvedAt: approval.approvedAt,
        notes: approval.notes,
      });
    } catch (error) {
      Logger.error('Approve booking error:', error);
      res.status(500).json({ error: 'Failed to approve booking' });
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;

      await this.rejectBooking.execute(bookingId);

      res.json({ message: 'Booking rejected successfully' });
    } catch (error) {
      Logger.error('Reject booking error:', error);
      res.status(500).json({ error: 'Failed to reject booking' });
    }
  }
}
