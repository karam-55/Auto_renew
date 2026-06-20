import { BookingApprovalRepository } from '../interfaces/BookingApprovalRepository';
import { BookingApproval } from '../../../domain/bookings/entities/BookingApproval';
import { v4 as uuidv4 } from 'uuid';

export class ApproveBooking {
  constructor(private readonly bookingApprovalRepository: BookingApprovalRepository) {}

  async execute(
    bookingId: string,
    approvedBy: string,
    notes?: string
  ): Promise<BookingApproval> {
    const approvalId = uuidv4();
    const approval = BookingApproval.create(
      approvalId,
      bookingId,
      approvedBy,
      notes
    );

    return await this.bookingApprovalRepository.create(approval);
  }
}
