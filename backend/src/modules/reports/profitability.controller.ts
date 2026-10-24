import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { ProfitabilityService } from './profitability.service';
import { AuthRequest } from '../../shared/middlewares/auth';

function parseDate(value: unknown, endOfDay = false): Date | undefined {
  if (value == null || value === '') return undefined;
  const raw = String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  return new Date(dateOnly
    ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : raw);
}

export class ProfitabilityController {
  private profitabilityService: ProfitabilityService;

  constructor() {
    this.profitabilityService = new ProfitabilityService();
  }

  getInvoiceProfit = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const profit = await this.profitabilityService.calculateInvoiceProfit(
        id,
        req.user!.tenantId
      );
      res.json({ profit });
    } catch (error: any) {
      Logger.error('Get invoice profit error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate invoice profit' });
    }
  };

  getServiceProfit = async (req: AuthRequest, res: Response) => {
    try {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to, true);
      
      const profits = await this.profitabilityService.calculateServiceProfit(
        req.user!.tenantId,
        fromDate,
        toDate
      );
      res.json({ data: profits });
    } catch (error: any) {
      Logger.error('Get service profit error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate service profit' });
    }
  };

  getWorkOrderProfit = async (req: AuthRequest, res: Response) => {
    try {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to, true);
      const data = await this.profitabilityService.calculateWorkOrderProfit(req.user!.tenantId, fromDate, toDate);
      res.json({ data });
    } catch (error: any) {
      Logger.error('Get work-order profitability error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate work-order profitability' });
    }
  };

  getDepartmentProfit = async (req: AuthRequest, res: Response) => {
    try {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to, true);
      const data = await this.profitabilityService.calculateDepartmentProfit(req.user!.tenantId, fromDate, toDate);
      res.json({ data });
    } catch (error: any) {
      Logger.error('Get department profitability error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate department profitability' });
    }
  };

  getTechnicianProfit = async (req: AuthRequest, res: Response) => {
    try {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to, true);
      
      const profits = await this.profitabilityService.calculateTechnicianProfit(
        req.user!.tenantId,
        fromDate,
        toDate
      );
      res.json({ data: profits });
    } catch (error: any) {
      Logger.error('Get technician profit error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate technician profit' });
    }
  };

  getCustomerProfit = async (req: AuthRequest, res: Response) => {
    try {
      const fromDate = parseDate(req.query.from);
      const toDate = parseDate(req.query.to, true);
      
      const profits = await this.profitabilityService.calculateCustomerProfit(
        req.user!.tenantId,
        fromDate,
        toDate
      );
      res.json({ data: profits });
    } catch (error: any) {
      Logger.error('Get customer profit error:', error);
      res.status(400).json({ error: error.message || 'Failed to calculate customer profit' });
    }
  };
}
