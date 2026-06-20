import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { GetBookingTrackingInfo } from '../../../application/customer-tracking/use-cases/GetBookingTrackingInfo';
import { PrismaBookingTrackingRepository } from '../../../infrastructure/customer-tracking/repositories/PrismaBookingTrackingRepository';

export class CustomerTrackingController {
  private getBookingTrackingInfo: GetBookingTrackingInfo;

  constructor() {
    const repository = new PrismaBookingTrackingRepository();
    this.getBookingTrackingInfo = new GetBookingTrackingInfo(repository);
  }

  async getTrackingInfo(req: Request, res: Response): Promise<void> {
    try {
      const { public_token } = req.params;

      if (!public_token) {
        res.status(400).json({ error: 'Public token is required' });
        return;
      }

      const trackingInfo = await this.getBookingTrackingInfo.execute(public_token);

      res.json(trackingInfo);
    } catch (error) {
      Logger.error('Tracking error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tracking info';
      
      if (errorMessage === 'Booking not found') {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to get tracking info' });
    }
  }
}
