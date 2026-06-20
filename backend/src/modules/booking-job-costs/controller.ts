import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { bookingJobCostService } from './service';

export class BookingJobCostController {
  async getByBooking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const bookingId = req.params.bookingId;
      const items = await bookingJobCostService.getByBooking(tenantId, bookingId);
      res.json({ success: true, data: items });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await bookingJobCostService.getById(tenantId, req.params.id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Not found' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await bookingJobCostService.create(tenantId, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const item = await bookingJobCostService.update(tenantId, req.params.id, req.body);
      if (!item) {
        res.status(404).json({ success: false, error: 'Not found' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const deleted = await bookingJobCostService.delete(tenantId, req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Not found' });
        return;
      }
      res.json({ success: true, message: 'Deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getVariance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const bookingId = req.params.bookingId;
      const { estimatedLaborCost, estimatedMaterialCost, estimatedOverheadCost } = req.query;
      const result = await bookingJobCostService.calculateJobCostVariance(
        tenantId,
        bookingId,
        Number(estimatedLaborCost || 0),
        Number(estimatedMaterialCost || 0),
        Number(estimatedOverheadCost || 0)
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const bookingJobCostController = new BookingJobCostController();
