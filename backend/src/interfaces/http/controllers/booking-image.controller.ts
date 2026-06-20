import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AddImage } from '../../../application/bookings/use-cases/AddImage';
import { RemoveImage } from '../../../application/bookings/use-cases/RemoveImage';
import { PrismaBookingImageRepository } from '../../../infrastructure/bookings/repositories/PrismaBookingImageRepository';

export class BookingImageController {
  private addImage: AddImage;
  private removeImage: RemoveImage;

  constructor() {
    const bookingImageRepository = new PrismaBookingImageRepository();
    this.addImage = new AddImage(bookingImageRepository);
    this.removeImage = new RemoveImage(bookingImageRepository);
  }

  async add(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, url, caption, uploadedBy } = req.body;

      const bookingImage = await this.addImage.execute(
        bookingId,
        url,
        caption,
        uploadedBy
      );

      res.status(201).json({
        id: bookingImage.id,
        bookingId: bookingImage.bookingId,
        url: bookingImage.url,
        caption: bookingImage.caption,
        uploadedBy: bookingImage.uploadedBy,
        createdAt: bookingImage.createdAt,
      });
    } catch (error) {
      Logger.error('Add image error:', error);
      res.status(500).json({ error: 'Failed to add image' });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.removeImage.execute(id);

      res.json({ message: 'Image removed successfully' });
    } catch (error) {
      Logger.error('Remove image error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove image';
      if (errorMessage === 'Booking image not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to remove image' });
    }
  }
}
