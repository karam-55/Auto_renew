import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { InsightsService } from './insights.service';

export class InsightsController {
  private insightsService: InsightsService;

  constructor() {
    this.insightsService = new InsightsService();
  }

  async getInsights(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || 'default';
      const insights = await this.insightsService.getInsights(tenantId);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      Logger.error('Error fetching insights:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch insights',
      });
    }
  }
}
