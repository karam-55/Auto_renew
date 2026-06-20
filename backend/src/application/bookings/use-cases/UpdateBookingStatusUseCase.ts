import { IBookingRepository } from '../interfaces/IBookingRepository';
import { UpdateBookingStatusCommand } from '../commands/UpdateBookingStatusCommand';
import { BookingDTO } from '../dto/BookingDTO';

export class UpdateBookingStatusUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(command: UpdateBookingStatusCommand): Promise<BookingDTO> {
    const { bookingId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find booking
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate status transition using domain logic
    // Note: This should use the BookingStatusValue.canTransitionTo() from domain layer
    // For now, we'll maintain the simplified validation here
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['CONFIRMED', 'CANCELLED', 'NO_SHOW', 'NO_INVOICE_REQUIRED'],
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW', 'NO_INVOICE_REQUIRED'],
      'IN_PROGRESS': ['WAITING_PARTS', 'READY', 'CANCELLED', 'NO_INVOICE_REQUIRED'],
      'WAITING_PARTS': ['IN_PROGRESS', 'READY', 'CANCELLED', 'NO_INVOICE_REQUIRED'],
      'READY': ['INVOICED', 'DELIVERED', 'NO_INVOICE_REQUIRED'],
      'INVOICED': ['PAID', 'CANCELLED'],
      'PAID': ['DELIVERED', 'COMPLETED'],
      'DELIVERED': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': [],
      'NO_SHOW': [],
      'NO_INVOICE_REQUIRED': ['COMPLETED', 'DELIVERED'],
    };

    const allowedTransitions = validTransitions[booking.status] || [];
    if (!allowedTransitions.includes(dto.status.toUpperCase())) {
      throw new Error(`Cannot transition from ${booking.status} to ${dto.status}`);
    }

    // Validate invoice linkage for terminal states
    const newStatus = dto.status.toUpperCase();
    const terminalStatesRequiringInvoice = ['READY', 'DELIVERED', 'COMPLETED', 'PAID'];
    if (terminalStatesRequiringInvoice.includes(newStatus) && newStatus !== 'NO_INVOICE_REQUIRED') {
      // Check if booking has an invoice
      // This requires access to invoice repository - for now, we'll add a placeholder check
      // In a full implementation, this would query the invoice repository
      if (!booking.invoiceId && newStatus !== 'NO_INVOICE_REQUIRED') {
        throw new Error(`Cannot transition to ${newStatus} without an invoice. Create an invoice first or mark as NO_INVOICE_REQUIRED.`);
      }
    }

    // Update booking status
    const updatedBooking = {
      ...booking,
      status: dto.status.toUpperCase(),
      updatedAt: new Date(),
    };

    const savedBooking = await this.bookingRepository.update(updatedBooking);

    return BookingDTO.fromEntity(savedBooking);
  }
}
