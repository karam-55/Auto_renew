import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { AdvancedReportsService } from './service';
import { ReportFilters } from './types';

export class AdvancedReportsController {
  private reportsService: AdvancedReportsService;

  constructor() {
    this.reportsService = new AdvancedReportsService();
  }

  // ============================================
  // SALES REPORTS
  // ============================================

  async getRevenueReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const { dateFrom, dateTo } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const report = await this.reportsService.getRevenueReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate revenue report',
      });
    }
  }

  async getSalesReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { dateFrom, dateTo, customerId } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        customerId: customerId as string,
      };

      const report = await this.reportsService.getSalesReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate sales report',
      });
    }
  }

  // ============================================
  // INVENTORY REPORTS
  // ============================================

  async getInventoryReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';

      const filters: ReportFilters = {};

      const report = await this.reportsService.getInventoryReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate inventory report',
      });
    }
  }

  // ============================================
  // PERFORMANCE REPORTS
  // ============================================

  async getMechanicPerformanceReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const { dateFrom, dateTo } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const report = await this.reportsService.getMechanicPerformanceReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate mechanic performance report',
      });
    }
  }

  async getPerformanceReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const tenantId = req.user.tenantId;
      const { dateFrom, dateTo } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const report = await this.reportsService.getPerformanceReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate performance report',
      });
    }
  }

  // ============================================
  // FINANCIAL REPORTS
  // ============================================

  async getFinancialReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const { dateFrom, dateTo } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const report = await this.reportsService.getFinancialReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate financial report',
      });
    }
  }

  // ============================================
  // CUSTOMER INSIGHTS
  // ============================================

  async getCustomerInsightsReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const { dateFrom, dateTo } = req.query;

      const filters: ReportFilters = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const report = await this.reportsService.getCustomerInsightsReport(tenantId, filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate customer insights report',
      });
    }
  }
}
