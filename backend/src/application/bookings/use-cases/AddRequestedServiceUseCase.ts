import { IBookingRepository } from '../interfaces/IBookingRepository';
import { IServiceRepository } from '../interfaces/IServiceRepository';
import { AddRequestedServiceCommand } from '../commands/AddRequestedServiceCommand';
import { BookingDTO } from '../dto/BookingDTO';

export class AddRequestedServiceUseCase {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly serviceRepository: IServiceRepository
  ) {}

  async execute(command: AddRequestedServiceCommand): Promise<BookingDTO> {
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
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      throw new Error('Cannot add services to a booking that is already in progress or completed');
    }

    // Validate service exists
    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Check if service already exists in requested services
    const existingService = booking.requestedServices.find(
      (s: any) => s.serviceId === dto.serviceId
    );
    if (existingService) {
      throw new Error('Service already exists in requested services');
    }

    // Add requested service
    const updatedBooking = {
      ...booking,
      requestedServices: [
        ...booking.requestedServices,
        {
          id: `${dto.bookingId}-${dto.serviceId}-${Date.now()}`,
          serviceId: dto.serviceId,
          quantity: dto.quantity,
          serviceName: service.name,
          price: service.price,
        },
      ],
      updatedAt: new Date(),
    };

    const savedBooking = await this.bookingRepository.update(updatedBooking);

    return BookingDTO.fromEntity(savedBooking);
  }
}
