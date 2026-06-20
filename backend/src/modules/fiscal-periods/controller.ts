import { Request, Response } from 'express';
import { FiscalPeriodService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { CreateFiscalPeriodDto, UpdateFiscalPeriodDto } from './types';

export class FiscalPeriodController {
  private fiscalPeriodService: FiscalPeriodService;

  constructor() {
    this.fiscalPeriodService = new FiscalPeriodService();
  }

  createFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: CreateFiscalPeriodDto = req.body;

      const period = await this.fiscalPeriodService.createFiscalPeriod(tenantId, data);

      res.status(201).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Create fiscal period error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create fiscal period',
      });
    }
  };

  getFiscalPeriods = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        status: req.query.status as any,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const periods = await this.fiscalPeriodService.getFiscalPeriods(tenantId, filters);

      res.status(200).json({
        success: true,
        data: periods,
      });
    } catch (error) {
      Logger.error('Get fiscal periods error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fiscal periods',
      });
    }
  };

  getFiscalPeriodById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const period = await this.fiscalPeriodService.getFiscalPeriodById(tenantId, id);

      if (!period) {
        res.status(404).json({
          success: false,
          error: 'Fiscal period not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Get fiscal period by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fiscal period',
      });
    }
  };

  updateFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateFiscalPeriodDto = req.body;

      const period = await this.fiscalPeriodService.updateFiscalPeriod(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Update fiscal period error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update fiscal period',
      });
    }
  };

  closeFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;

      const period = await this.fiscalPeriodService.closeFiscalPeriod(tenantId, id, userId);

      res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Close fiscal period error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close fiscal period',
      });
    }
  };

  reopenFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const period = await this.fiscalPeriodService.reopenFiscalPeriod(tenantId, id);

      res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Reopen fiscal period error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reopen fiscal period',
      });
    }
  };

  deleteFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.fiscalPeriodService.deleteFiscalPeriod(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Fiscal period deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete fiscal period error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete fiscal period',
      });
    }
  };

  getFiscalPeriodSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const summary = await this.fiscalPeriodService.getFiscalPeriodSummary(tenantId, id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      Logger.error('Get fiscal period summary error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get fiscal period summary',
      });
    }
  };

  getCurrentFiscalPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const period = await this.fiscalPeriodService.getCurrentFiscalPeriod(tenantId);

      if (!period) {
        res.status(404).json({
          success: false,
          error: 'No active fiscal period found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: period,
      });
    } catch (error) {
      Logger.error('Get current fiscal period error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current fiscal period',
      });
    }
  };
}