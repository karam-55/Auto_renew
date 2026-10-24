import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { supplierPaymentService } from './service';

export class SupplierPaymentController {
  create = async (req: AuthRequest, res: Response) => {
    try {
      const payment = await supplierPaymentService.createPayment(req.user!.tenantId, req.user!.id, req.body || {});
      res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
      Logger.error('Create supplier payment error', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to record supplier payment' });
    }
  };

  statement = async (req: AuthRequest, res: Response) => {
    try {
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const statement = await supplierPaymentService.getSupplierStatement(
        req.user!.tenantId,
        req.params.supplierId,
        from,
        to,
      );
      res.json({ success: true, data: statement });
    } catch (error: any) {
      Logger.error('Get supplier statement error', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to load supplier statement' });
    }
  };
}

export const supplierPaymentController = new SupplierPaymentController();
