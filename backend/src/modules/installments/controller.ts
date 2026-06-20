import { Request, Response } from 'express';
import { InstallmentService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { CreateInstallmentPlanDto, UpdateInstallmentPlanDto } from './types';

export class InstallmentController {
  private installmentService: InstallmentService;

  constructor() {
    this.installmentService = new InstallmentService();
  }

  setIo(io: any) {
    this.installmentService.setIo(io);
  }

  // Installment plan endpoints
  createInstallmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateInstallmentPlanDto = req.body;

      // Handle date conversions
      if (data.startDate && typeof data.startDate === 'string') {
        data.startDate = new Date(data.startDate);
      }

      const plan = await this.installmentService.createInstallmentPlan(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      Logger.error('Create installment plan error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create installment plan',
      });
    }
  };

  getInstallmentPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        supplierId: req.query.supplierId as string,
        invoiceId: req.query.invoiceId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
      };

      const plans = await this.installmentService.getInstallmentPlans(tenantId, filters);

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      Logger.error('Get installment plans error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installment plans',
      });
    }
  };

  getInstallmentPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const plan = await this.installmentService.getInstallmentPlanById(tenantId, id);

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Installment plan not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      Logger.error('Get installment plan by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installment plan',
      });
    }
  };

  updateInstallmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateInstallmentPlanDto = req.body;

      const plan = await this.installmentService.updateInstallmentPlan(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      Logger.error('Update installment plan error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update installment plan',
      });
    }
  };

  payDownPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      const { amountSYP, amountUSD } = req.body;

      if (!amountSYP || amountSYP <= 0) {
        res.status(400).json({
          success: false,
          error: 'AmountSYP is required and must be greater than 0',
        });
        return;
      }

      const plan = await this.installmentService.payDownPayment(tenantId, id, amountSYP, amountUSD, userId);

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      Logger.error('Pay down payment error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pay down payment',
      });
    }
  };

  payInstallment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const { id } = req.params;
      const { amountSYP, amountUSD, paymentId } = req.body;

      if (!amountSYP || amountSYP <= 0) {
        res.status(400).json({
          success: false,
          error: 'AmountSYP is required and must be greater than 0',
        });
        return;
      }

      const installment = await this.installmentService.payInstallment(tenantId, id, amountSYP, amountUSD, userId, paymentId);

      res.status(200).json({
        success: true,
        data: installment,
      });
    } catch (error) {
      Logger.error('Pay installment error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pay installment',
      });
    }
  };

  cancelInstallmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const plan = await this.installmentService.cancelInstallmentPlan(tenantId, id);

      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      Logger.error('Cancel installment plan error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel installment plan',
      });
    }
  };

  getOverdueInstallments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const installments = await this.installmentService.getOverdueInstallments(tenantId);

      res.status(200).json({
        success: true,
        data: installments,
      });
    } catch (error) {
      Logger.error('Get overdue installments error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get overdue installments',
      });
    }
  };

  getInstallmentsDueSoon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const installments = await this.installmentService.getInstallmentsDueSoon(tenantId);

      res.status(200).json({
        success: true,
        data: installments,
      });
    } catch (error) {
      Logger.error('Get installments due soon error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installments due soon',
      });
    }
  };

  getInstallmentPlanSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        supplierId: req.query.supplierId as string,
      };

      const summaries = await this.installmentService.getInstallmentPlanSummaries(tenantId, filters);

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      Logger.error('Get installment plan summaries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get installment plan summaries',
      });
    }
  };
}