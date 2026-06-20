import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { TrackingResolver } from '../../../infrastructure/services/tracking-resolver';

export class TrackingController {
  private trackingResolver: TrackingResolver;

  constructor() {
    this.trackingResolver = new TrackingResolver();
  }

  async getByPublicToken(req: Request, res: Response): Promise<void> {
    try {
      const { publicToken } = req.params;
      const trackingInfo = await this.trackingResolver.resolveByPublicToken(publicToken);

      ErrorMiddleware.success(res, trackingInfo, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to fetch tracking info', 404);
    }
  }
}
