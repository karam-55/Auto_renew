import { Request, Response } from 'express';
import { DealerService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class DealerController {
  private dealerService: DealerService;

  constructor() {
    this.dealerService = new DealerService();
  }

  createDealer = async (req: AuthRequest, res: Response) => {
    try {
      const dealer = await this.dealerService.createDealer(req.user!.tenantId, req.body);
      res.status(201).json({ dealer });
    } catch (error: any) {
      Logger.error('Create dealer error', error);
      res.status(400).json({ error: error.message || 'Failed to create dealer' });
    }
  };

  getDealers = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;
      const filters = status ? { status: status as any } : undefined;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;
      const [dealers, total] = await Promise.all([
        this.dealerService.getDealers(req.user!.tenantId, filters, skip, limit),
        this.dealerService.getDealersCount(req.user!.tenantId, filters),
      ]);
      res.json({
        data: dealers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      Logger.error('Get dealers error', error);
      res.status(500).json({ error: 'Failed to fetch dealers' });
    }
  };

  getDealerById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const dealer = await this.dealerService.getDealerById(id, req.user!.tenantId);
      if (!dealer) {
        return res.status(404).json({ error: 'Dealer not found' });
      }
      res.json({ dealer });
    } catch (error) {
      Logger.error('Get dealer error', error);
      res.status(500).json({ error: 'Failed to fetch dealer' });
    }
  };

  updateDealer = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const dealer = await this.dealerService.updateDealer(id, req.user!.tenantId, req.body);
      res.json({ dealer });
    } catch (error: any) {
      Logger.error('Update dealer error', error);
      res.status(400).json({ error: error.message || 'Failed to update dealer' });
    }
  };

  deleteDealer = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.dealerService.deleteDealer(id, req.user!.tenantId);
      res.json({ message: 'Dealer deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete dealer error', error);
      res.status(400).json({ error: error.message || 'Failed to delete dealer' });
    }
  };

  searchDealers = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query required' });
      }
      const dealers = await this.dealerService.searchDealers(req.user!.tenantId, q);
      res.json({ dealers });
    } catch (error) {
      Logger.error('Search dealers error', error);
      res.status(500).json({ error: 'Failed to search dealers' });
    }
  };
}
