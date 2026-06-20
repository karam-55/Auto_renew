import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ApproveAdditionalServiceCommand } from '../commands/ApproveAdditionalServiceCommand';
import { BookingDTO } from '../dto/BookingDTO';

export class ApproveAdditionalServiceUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(command: ApproveAdditionalServiceCommand): Promise<BookingDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find booking
    const booking = await this.bookingRepository.findById(dto.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Find the additional service item
    const serviceItem = booking.additionalServices.find(
      (s: any) => s.id === dto.serviceItemId
    );
    if (!serviceItem) {
      throw new Error('Additional service item not found');
    }

    // Check if already approved
    if (serviceItem.approved) {
      throw new Error('Additional service is already approved');
    }

    // Approve the additional service
    const updatedServices = booking.additionalServices.map((s: any) =>
      s.id === dto.serviceItemId ? { ...s, approved: true } : s
    );

    const updatedBooking = {
      ...booking,
      additionalServices: updatedServices,
      updatedAt: new Date(),
    };

    const savedBooking = await this.bookingRepository.update(updatedBooking);

    return BookingDTO.fromEntity(savedBooking);
  }
}
