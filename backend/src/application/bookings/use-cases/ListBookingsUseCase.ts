import { IBookingRepository } from '../interfaces/IBookingRepository';
import { ListBookingsQuery } from '../queries/ListBookingsQuery';
import { BookingDTO } from '../dto/BookingDTO';

export class ListBookingsUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(query: ListBookingsQuery): Promise<BookingDTO[]> {
    const { tenantId } = query;

    const bookings = await this.bookingRepository.list(tenantId);

    return bookings.map(booking => BookingDTO.fromEntity(booking));
  }
}
