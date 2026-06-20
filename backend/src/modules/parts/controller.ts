import { Request, Response } from 'express';
import { PartService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { PartFilters, PaginationParams } from './types';
import { Logger } from '../../infrastructure/logging/logger';

export class PartController {
  private partService: PartService;

  constructor() {
    this.partService = new PartService();
  }

  createPart = async (req: AuthRequest, res: Response) => {
    try {
      const part = await this.partService.createPart(req.user!.tenantId, req.body);
      res.status(201).json({ part });
    } catch (error: any) {
      Logger.error('Create part error', error);
      res.status(400).json({ error: error.message || 'Failed to create part' });
    }
  };

  getParts = async (req: AuthRequest, res: Response) => {
    try {
      const filters: PartFilters = {
        categoryId: req.query.categoryId as string | undefined,
        supplierId: req.query.supplierId as string | undefined,
        status: req.query.status as any,
        minQuantity: req.query.minQuantity ? parseInt(req.query.minQuantity as string) : undefined,
        maxQuantity: req.query.maxQuantity ? parseInt(req.query.maxQuantity as string) : undefined,
        search: req.query.search as string | undefined,
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await this.partService.getParts(req.user!.tenantId, filters, pagination);
      res.json({ parts: result.data, ...result });
    } catch (error: any) {
      Logger.error('Get parts error', error);
      res.status(500).json({ error: error.message || 'Failed to fetch parts' });
    }
  };

  getPartById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const part = await this.partService.getPartById(id, req.user!.tenantId);

      if (!part) {
        return res.status(404).json({ error: 'Part not found' });
      }

      res.json({ part });
    } catch (error: any) {
      Logger.error('Get part error', error);
      res.status(500).json({ error: error.message || 'Failed to fetch part' });
    }
  };

  updatePart = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const part = await this.partService.updatePart(id, req.user!.tenantId, req.body);
      res.json({ part });
    } catch (error: any) {
      Logger.error('Update part error', error);
      res.status(400).json({ error: error.message || 'Failed to update part' });
    }
  };

  deletePart = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.partService.deletePart(id, req.user!.tenantId);
      res.json({ message: 'Part deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete part error', error);
      res.status(400).json({ error: error.message || 'Failed to delete part' });
    }
  };

  searchParts = async (req: AuthRequest, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const parts = await this.partService.searchParts(req.user!.tenantId, query);
      res.json({ parts });
    } catch (error: any) {
      Logger.error('Search parts error:', error);
      res.status(500).json({ error: error.message || 'Failed to search parts' });
    }
  };

  updateQuantity = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { quantityChange } = req.body;

      if (typeof quantityChange !== 'number') {
        return res.status(400).json({ error: 'quantityChange must be a number' });
      }

      const part = await this.partService.updateQuantity(id, req.user!.tenantId, quantityChange);
      res.json({ part });
    } catch (error: any) {
      Logger.error('Update quantity error:', error);
      res.status(400).json({ error: error.message || 'Failed to update quantity' });
    }
  };

  getLowStockParts = async (req: AuthRequest, res: Response) => {
    try {
      const parts = await this.partService.getLowStockParts(req.user!.tenantId);
      res.json({ parts });
    } catch (error: any) {
      Logger.error('Get low stock parts error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch low stock parts' });
    }
  };
}
