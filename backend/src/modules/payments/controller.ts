import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { PaymentService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { CreatePaymentDto, UpdatePaymentDto } from './types';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreatePaymentDto = req.body;

      const payment = await this.paymentService.createPayment(tenantId, userId, data);

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      Logger.error('Create payment error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      });
    }
  };

  getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        paymentMethod: req.query.paymentMethod as any,
        invoiceId: req.query.invoiceId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        search: req.query.search as string,
      };

      const payments = await this.paymentService.getPayments(tenantId, filters);

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      Logger.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payments',
      });
    }
  };

  getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const payment = await this.paymentService.getPaymentById(tenantId, id);

      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      Logger.error('Get payment by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment',
      });
    }
  };

  updatePayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdatePaymentDto = req.body;

      const payment = await this.paymentService.updatePayment(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      Logger.error('Update payment error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment',
      });
    }
  };

  deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.paymentService.deletePayment(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Payment deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete payment error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment',
      });
    }
  };

  getPaymentSummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        paymentMethod: req.query.paymentMethod as any,
        invoiceId: req.query.invoiceId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const summaries = await this.paymentService.getPaymentSummaries(tenantId, filters);

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      Logger.error('Get payment summaries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment summaries',
      });
    }
  };
}