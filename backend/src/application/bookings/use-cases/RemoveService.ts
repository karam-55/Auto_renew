import { BookingServiceRepository } from '../interfaces/BookingServiceRepository';

export class RemoveService {
  constructor(private readonly bookingServiceRepository: BookingServiceRepository) {}

  async execute(bookingServiceId: string): Promise<void> {
    const bookingService = await this.bookingServiceRepository.findById(bookingServiceId);

    if (!bookingService) {
      throw new Error('Booking service not found');
    }

    await this.bookingServiceRepository.delete(bookingServiceId);
  }
}
