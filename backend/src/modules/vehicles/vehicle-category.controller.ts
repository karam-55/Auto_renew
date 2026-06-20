import { Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { VehicleCategoryService } from './vehicle-category.service';
import { AuthRequest } from '../../shared/middlewares/auth';

const vehicleCategoryService = new VehicleCategoryService();

export class VehicleCategoryController {
  async getAllCategories(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const categories = await vehicleCategoryService.getAllCategories(tenantId);
      res.json({ success: true, data: categories });
    } catch (error) {
      Logger.error('Error fetching vehicle categories:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  }

  async getCategoryById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const category = await vehicleCategoryService.getCategoryById(id, tenantId);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      Logger.error('Error fetching vehicle category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch category' });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      // Use nameAr as name if name is not provided
      const categoryData = {
        ...req.body,
        tenantId,
        name: req.body.name || req.body.nameAr,
      };

      const category = await vehicleCategoryService.createCategory(categoryData);

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      Logger.error('Error creating vehicle category:', error);
      res.status(500).json({ success: false, error: 'Failed to create category' });
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      await vehicleCategoryService.updateCategory(id, tenantId, req.body);
      res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
      Logger.error('Error updating vehicle category:', error);
      res.status(500).json({ success: false, error: 'Failed to update category' });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      await vehicleCategoryService.deleteCategory(id, tenantId);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      Logger.error('Error deleting vehicle category:', error);
      if (error.message === 'Cannot delete category with vehicles') {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
  }
}
