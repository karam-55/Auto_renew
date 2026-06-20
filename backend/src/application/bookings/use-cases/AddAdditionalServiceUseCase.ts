import { IBookingRepository } from '../interfaces/IBookingRepository';
import { IServiceRepository } from '../interfaces/IServiceRepository';
import { AddAdditionalServiceCommand } from '../commands/AddAdditionalServiceCommand';
import { BookingDTO } from '../dto/BookingDTO';

export class AddAdditionalServiceUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly serviceRepository: IServiceRepository
  ) {}

  async execute(command: AddAdditionalServiceCommand): Promise<BookingDTO> {
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

    // Check if booking can be modified
    if (booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
      throw new Error('Cannot add additional services to this booking');
    }

    // Validate service exists
    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Add additional service (pending approval)
    const updatedBooking = {
      ...booking,
      additionalServices: [
        ...booking.additionalServices,
        {
          id: `${dto.bookingId}-add-${dto.serviceId}-${Date.now()}`,
          serviceId: dto.serviceId,
          quantity: dto.quantity,
          serviceName: service.name,
          price: service.price,
          approved: false,
        },
      ],
      updatedAt: new Date(),
    };

    const savedBooking = await this.bookingRepository.update(updatedBooking);

    return BookingDTO.fromEntity(savedBooking);
  }
}
