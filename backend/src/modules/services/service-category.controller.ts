import { Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { ServiceCategoryService } from './service-category.service';
import { AuthRequest } from '../../shared/middlewares/auth';

const serviceCategoryService = new ServiceCategoryService();

export class ServiceCategoryController {
  async initializeDefaultDepartments(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const categories = await serviceCategoryService.initializeDefaultDepartments(tenantId);
      return res.json({ success: true, data: categories });
    } catch (error) {
      Logger.error('Error initializing default service departments:', error);
      return res.status(500).json({ success: false, error: 'Failed to initialize service departments' });
    }
  }

  async getAllCategories(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const categories = await serviceCategoryService.getAllCategories(tenantId);
      res.json({ success: true, data: categories });
    } catch (error) {
      Logger.error('Error fetching service categories:', error);
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

      const category = await serviceCategoryService.getCategoryById(id, tenantId);
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      Logger.error('Error fetching service category:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch category' });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const category = await serviceCategoryService.createCategory({
        ...req.body,
        tenantId,
      });

      res.status(201).json({ success: true, data: category });
    } catch (error) {
      Logger.error('Error creating service category:', error);
      const message = error instanceof Error ? error.message : 'Failed to create category';
      res.status(
        message.startsWith('Revenue account must be') ||
        message.startsWith('Cost account must be') ||
        message.startsWith('Cost center must be')
          ? 400
          : 500
      )
        .json({ success: false, error: message });
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const result = await serviceCategoryService.updateCategory(id, tenantId, req.body);
      if (result.count === 0) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
      Logger.error('Error updating service category:', error);
      const message = error instanceof Error ? error.message : 'Failed to update category';
      res.status(
        message.startsWith('Revenue account must be') ||
        message.startsWith('Cost account must be') ||
        message.startsWith('Cost center must be')
          ? 400
          : 500
      )
        .json({ success: false, error: message });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      await serviceCategoryService.deleteCategory(id, tenantId);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      Logger.error('Error deleting service category:', error);
      if (error.message === 'Category not found') {
        return res.status(404).json({ success: false, error: error.message });
      }
      if (error.message === 'Cannot delete category with services') {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
  }
}
