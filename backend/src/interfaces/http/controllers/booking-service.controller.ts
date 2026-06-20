import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AddService } from '../../../application/bookings/use-cases/AddService';
import { RemoveService } from '../../../application/bookings/use-cases/RemoveService';
import { PrismaBookingServiceRepository } from '../../../infrastructure/bookings/repositories/PrismaBookingServiceRepository';

export class BookingServiceController {
  private addService: AddService;
  private removeService: RemoveService;

  constructor() {
    const bookingServiceRepository = new PrismaBookingServiceRepository();
    this.addService = new AddService(bookingServiceRepository);
    this.removeService = new RemoveService(bookingServiceRepository);
  }

  async add(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, serviceId, priceSYP, priceUSD, notes } = req.body;

      const bookingService = await this.addService.execute(
        bookingId,
        serviceId,
        priceSYP,
        priceUSD,
        notes
      );

      res.status(201).json({
        id: bookingService.id,
        bookingId: bookingService.bookingId,
        serviceId: bookingService.serviceId,
        priceSYP: bookingService.priceSYP,
        priceUSD: bookingService.priceUSD,
        notes: bookingService.notes,
        createdAt: bookingService.createdAt,
      });
    } catch (error) {
      Logger.error('Add service error:', error);
      res.status(500).json({ error: 'Failed to add service' });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.removeService.execute(id);

      res.json({ message: 'Service removed successfully' });
    } catch (error) {
      Logger.error('Remove service error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove service';
      if (errorMessage === 'Booking service not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to remove service' });
    }
  }
}
