import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { PartCategoryService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class PartCategoryController {
  private partCategoryService: PartCategoryService;

  constructor() {
    this.partCategoryService = new PartCategoryService();
  }

  createPartCategory = async (req: AuthRequest, res: Response) => {
    try {
      const category = await this.partCategoryService.createPartCategory(req.user!.tenantId, req.body);
      res.status(201).json({ category });
    } catch (error: any) {
      Logger.error('Create part category error:', error);
      res.status(400).json({ error: error.message || 'Failed to create part category' });
    }
  };

  getPartCategories = async (req: AuthRequest, res: Response) => {
    try {
      const categories = await this.partCategoryService.getPartCategories(req.user!.tenantId);
      res.json({ categories });
    } catch (error: any) {
      Logger.error('Get part categories error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch part categories' });
    }
  };

  getCategoryTree = async (req: AuthRequest, res: Response) => {
    try {
      const tree = await this.partCategoryService.getCategoryTree(req.user!.tenantId);
      res.json({ tree });
    } catch (error: any) {
      Logger.error('Get category tree error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch category tree' });
    }
  };

  getPartCategoryById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const category = await this.partCategoryService.getPartCategoryById(id, req.user!.tenantId);

      if (!category) {
        return res.status(404).json({ error: 'Part category not found' });
      }

      res.json({ category });
    } catch (error: any) {
      Logger.error('Get part category error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch part category' });
    }
  };

  updatePartCategory = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const category = await this.partCategoryService.updatePartCategory(id, req.user!.tenantId, req.body);
      res.json({ category });
    } catch (error: any) {
      Logger.error('Update part category error:', error);
      res.status(400).json({ error: error.message || 'Failed to update part category' });
    }
  };

  deletePartCategory = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.partCategoryService.deletePartCategory(id, req.user!.tenantId);
      res.json({ message: 'Part category deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete part category error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete part category' });
    }
  };
}
