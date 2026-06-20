import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { assetService } from './service';

export class AssetController {
  // ─── Categories ───
  async getAllCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const cats = await assetService.getAllCategories(tenantId);
      res.json({ success: true, data: cats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const cat = await assetService.createCategory(tenantId, req.body);
      res.status(201).json({ success: true, data: cat });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const cat = await assetService.updateCategory(tenantId, req.params.id, req.body);
      if (!cat) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, data: cat });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const deleted = await assetService.deleteCategory(tenantId, req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Category not found' });
        return;
      }
      res.json({ success: true, message: 'Category deactivated' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ─── Assets ───
  async getAllAssets(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const assets = await assetService.getAllAssets(tenantId);
      res.json({ success: true, data: assets });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createAsset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const asset = await assetService.createAsset(tenantId, req.body);
      res.status(201).json({ success: true, data: asset });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateAsset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const asset = await assetService.updateAsset(tenantId, req.params.id, req.body);
      if (!asset) {
        res.status(404).json({ success: false, error: 'Asset not found' });
        return;
      }
      res.json({ success: true, data: asset });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteAsset(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const deleted = await assetService.deleteAsset(tenantId, req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Asset not found' });
        return;
      }
      res.json({ success: true, message: 'Asset deactivated' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const assetController = new AssetController();
