import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { PublicService } from './service';

export class PublicController {
  private publicService: PublicService;

  constructor() {
    this.publicService = new PublicService();
  }

  /**
   * GET /public/booking/:publicToken
   * Get booking details by public token
   * NO AUTHENTICATION REQUIRED - Public endpoint
   */
  getBookingByPublicToken = async (req: Request, res: Response) => {
    try {
      const { publicToken } = req.params;

      if (!publicToken) {
        return res.status(400).json({ error: 'Public token is required' });
      }

      const booking = await this.publicService.getBookingByPublicToken(publicToken);

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found or invalid token' });
      }

      res.json({ booking });
    } catch (error) {
      Logger.error('Get booking by public token error:', error);
      res.status(500).json({ error: 'Failed to fetch booking details' });
    }
  };

  /**
   * GET /public/validate/:publicToken
   * Validate public token
   * NO AUTHENTICATION REQUIRED - Public endpoint
   */
  validatePublicToken = async (req: Request, res: Response) => {
    try {
      const { publicToken } = req.params;

      if (!publicToken) {
        return res.status(400).json({ error: 'Public token is required' });
      }

      const validation = await this.publicService.validatePublicToken(publicToken);

      if (!validation.valid) {
        return res.status(404).json({ error: validation.error || 'Invalid token' });
      }

      res.json(validation);
    } catch (error) {
      Logger.error('Validate public token error:', error);
      res.status(500).json({ error: 'Failed to validate token' });
    }
  };
}
