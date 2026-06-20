import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { ProfitabilityService } from './profitability.service';
import { AuthRequest } from '../../shared/middlewares/auth';

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
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
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

  getTechnicianProfit = async (req: AuthRequest, res: Response) => {
    try {
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
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
      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;
      
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
