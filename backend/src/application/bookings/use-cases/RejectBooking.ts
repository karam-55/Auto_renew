import { BookingApprovalRepository } from '../interfaces/BookingApprovalRepository';

export class RejectBooking {
  constructor(private readonly bookingApprovalRepository: BookingApprovalRepository) {}

  async execute(bookingId: string): Promise<void> {
    await this.bookingApprovalRepository.deleteByBookingId(bookingId);
  }
}
