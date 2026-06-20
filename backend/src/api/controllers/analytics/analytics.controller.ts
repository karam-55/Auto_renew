import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import analyticsService from '../../../services/analytics.service';
import { requirePermission } from '../../../middleware/permission.middleware';
import { CacheUtil } from '../../../shared/utils/cache';

class AnalyticsController {
  /**
   * Get analytics summary for overview screen
   */
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const sales = await analyticsService.getSalesAnalytics(tenantId, 'all', {
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dateTo: new Date(),
      }) as any;

      res.json({
        satisfactionRate: Math.round(Math.random() * 20 + 80), // placeholder until real feedback system
        satisfactionTrend: Math.round(Math.random() * 10 - 5),
        avgInvoiceValue: sales?.averageInvoiceValue || sales?.averageRevenue || 0,
        retentionRate: Math.round(Math.random() * 30 + 20), // placeholder
        forecastGrowth: Math.round(Math.random() * 20 + 5), // placeholder
        revenueByDay: sales?.revenueByDay || [],
        bookingsByDay: sales?.bookingsByDay || [],
      });
    } catch (error) {
      Logger.error('Error getting analytics summary:', error);
      res.status(500).json({ error: 'Failed to get analytics summary' });
    }
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | 'all' || 'all';
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const analytics = await analyticsService.getSalesAnalytics(tenantId, branchId, { dateFrom, dateTo });
      res.json(analytics);
    } catch (error) {
      Logger.error('Error getting sales analytics:', error);
      res.status(500).json({ error: 'Failed to get sales analytics' });
    }
  }

  /**
   * Get profitability analytics
   */
  async getProfitabilityAnalytics(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | 'all' || 'all';
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const analytics = await analyticsService.getProfitabilityAnalytics(tenantId, branchId, { dateFrom, dateTo });
      res.json(analytics);
    } catch (error) {
      Logger.error('Error getting profitability analytics:', error);
      res.status(500).json({ error: 'Failed to get profitability analytics' });
    }
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | 'all' || 'all';
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      // Cache key based on params
      const cacheKey = `booking-analytics:${tenantId}:${branchId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;

      // Try cache first (30 seconds TTL for booking analytics)
      const cached = await CacheUtil.get<any>(cacheKey);
      if (cached) {
        return res.json({ ...cached, cached: true });
      }

      const analytics = await analyticsService.getBookingAnalytics(tenantId, branchId, { dateFrom, dateTo });

      // Cache for 30 seconds
      await CacheUtil.set(cacheKey, analytics, { ttl: 30 });

      res.json(analytics);
    } catch (error) {
      Logger.error('Error getting booking analytics:', error);
      res.status(500).json({ error: 'Failed to get booking analytics' });
    }
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | 'all' || 'all';

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const analytics = await analyticsService.getInventoryAnalytics(tenantId, branchId);
      res.json(analytics);
    } catch (error) {
      Logger.error('Error getting inventory analytics:', error);
      res.status(500).json({ error: 'Failed to get inventory analytics' });
    }
  }

  /**
   * Get membership analytics
   */
  async getMembershipAnalytics(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const branchId = req.query.branchId as string | 'all' || 'all';
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const analytics = await analyticsService.getMembershipAnalytics(tenantId, branchId, { dateFrom, dateTo });
      res.json(analytics);
    } catch (error) {
      Logger.error('Error getting membership analytics:', error);
      res.status(500).json({ error: 'Failed to get membership analytics' });
    }
  }

  /**
   * Get branch comparison (admin only)
   */
  async getBranchComparison(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const comparison = await analyticsService.getBranchComparison(tenantId, { dateFrom, dateTo });
      res.json(comparison);
    } catch (error) {
      Logger.error('Error getting branch comparison:', error);
      res.status(500).json({ error: 'Failed to get branch comparison' });
    }
  }

  /**
   * Clear analytics cache
   */
  async clearCache(req: Request, res: Response) {
    try {
      analyticsService.clearCache();
      res.json({ message: 'Analytics cache cleared' });
    } catch (error) {
      Logger.error('Error clearing analytics cache:', error);
      res.status(500).json({ error: 'Failed to clear analytics cache' });
    }
  }
}

export default new AnalyticsController();
