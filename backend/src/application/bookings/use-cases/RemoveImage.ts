import { BookingImageRepository } from '../interfaces/BookingImageRepository';

export class RemoveImage {
  constructor(private readonly bookingImageRepository: BookingImageRepository) {}

  async execute(bookingImageId: string): Promise<void> {
    const bookingImage = await this.bookingImageRepository.findById(bookingImageId);

    if (!bookingImage) {
      throw new Error('Booking image not found');
    }

    await this.bookingImageRepository.delete(bookingImageId);
  }
}
