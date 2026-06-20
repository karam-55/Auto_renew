import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { VehicleAnalyticsService } from './analytics.service';

export class VehicleAnalyticsController {
  private analyticsService: VehicleAnalyticsService;

  constructor() {
    this.analyticsService = new VehicleAnalyticsService();
  }

  async getVehicleStats(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const stats = await this.analyticsService.getVehicleStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error) {
      Logger.error('Get vehicle stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vehicle stats' });
    }
  }

  async getVehicleHistoryStats(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const days = parseInt(req.query.days as string) || 30;

      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const stats = await this.analyticsService.getVehicleHistoryStats(tenantId, days);
      res.json({ success: true, data: stats });
    } catch (error) {
      Logger.error('Get vehicle history stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to get vehicle history stats' });
    }
  }
}
