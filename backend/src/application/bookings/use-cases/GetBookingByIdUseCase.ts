import { IBookingRepository } from '../interfaces/IBookingRepository';
import { GetBookingByIdQuery } from '../queries/GetBookingByIdQuery';
import { BookingDTO } from '../dto/BookingDTO';

export class GetBookingByIdUseCase {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(query: GetBookingByIdQuery): Promise<BookingDTO> {
    const { bookingId } = query;

    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    return BookingDTO.fromEntity(booking);
  }
}
