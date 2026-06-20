import { BookingServiceRepository } from '../interfaces/BookingServiceRepository';
import { BookingService } from '../../../domain/bookings/entities/BookingService';
import { v4 as uuidv4 } from 'uuid';

export class AddService {
  constructor(private readonly bookingServiceRepository: BookingServiceRepository) {}

  async execute(
    bookingId: string,
    serviceId: string,
    priceSYP: number,
    priceUSD?: number,
    notes?: string
  ): Promise<BookingService> {
    const bookingServiceId = uuidv4();
    const bookingService = BookingService.create(
      bookingServiceId,
      bookingId,
      serviceId,
      priceSYP,
      priceUSD,
      notes
    );

    return await this.bookingServiceRepository.create(bookingService);
  }
}
