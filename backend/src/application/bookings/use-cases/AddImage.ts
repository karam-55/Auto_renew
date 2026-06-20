import { BookingImageRepository } from '../interfaces/BookingImageRepository';
import { BookingImage } from '../../../domain/bookings/entities/BookingImage';
import { v4 as uuidv4 } from 'uuid';

export class AddImage {
  constructor(private readonly bookingImageRepository: BookingImageRepository) {}

  async execute(
    bookingId: string,
    url: string,
    caption?: string,
    uploadedBy?: string
  ): Promise<BookingImage> {
    const bookingImageId = uuidv4();
    const bookingImage = BookingImage.create(
      bookingImageId,
      bookingId,
      url,
      caption,
      uploadedBy
    );

    return await this.bookingImageRepository.create(bookingImage);
  }
}
