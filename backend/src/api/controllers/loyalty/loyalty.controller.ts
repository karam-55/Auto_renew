import { Request, Response } from 'express';
import { LoyaltyService } from '../../../modules/loyalty/loyalty.service';

export class LoyaltyController {
  private loyaltyService: LoyaltyService;

  constructor() {
    this.loyaltyService = new LoyaltyService();
  }

  async getCustomerPoints(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const points = await this.loyaltyService.getCustomerPoints(customerId, tenantId);
      
      res.json({ success: true, data: { points } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getPointTransactions(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const customerId = req.params.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const transactions = await this.loyaltyService.getPointTransactions(customerId, tenantId, limit);
      
      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async redeemPoints(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const newPoints = await this.loyaltyService.redeemPoints({
        tenantId,
        customerId,
        points: req.body.points,
        reference: req.body.reference,
      });
      
      res.json({ success: true, data: { points: newPoints } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async addPoints(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const newPoints = await this.loyaltyService.addPoints({
        tenantId,
        customerId,
        points: req.body.points,
        source: req.body.source || 'MANUAL',
        reference: req.body.reference,
      });
      
      res.json({ success: true, data: { points: newPoints } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getAllCustomersWithPoints(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const customers = await this.loyaltyService.getAllCustomersWithPoints(tenantId);
      
      res.json({ success: true, data: customers });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
