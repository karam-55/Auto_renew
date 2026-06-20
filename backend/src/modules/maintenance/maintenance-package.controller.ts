import { Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { MaintenancePackageService } from './maintenance-package.service';
import { AuthRequest } from '../../shared/middlewares/auth';

const maintenancePackageService = new MaintenancePackageService();

export class MaintenancePackageController {
  async getAllPackages(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const packages = await maintenancePackageService.getAllPackages(tenantId);
      res.json({ success: true, data: packages });
    } catch (error) {
      Logger.error('Error fetching maintenance packages:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch packages' });
    }
  }

  async getPackageById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const pkg = await maintenancePackageService.getPackageById(id, tenantId);
      if (!pkg) {
        return res.status(404).json({ success: false, error: 'Package not found' });
      }

      res.json({ success: true, data: pkg });
    } catch (error) {
      Logger.error('Error fetching maintenance package:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch package' });
    }
  }

  async createPackage(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const pkg = await maintenancePackageService.createPackage({
        ...req.body,
        tenantId,
      });

      res.status(201).json({ success: true, data: pkg });
    } catch (error) {
      Logger.error('Error creating maintenance package:', error);
      res.status(500).json({ success: false, error: 'Failed to create package' });
    }
  }

  async updatePackage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const pkg = await maintenancePackageService.updatePackage(id, tenantId, req.body);
      res.json({ success: true, data: pkg });
    } catch (error) {
      Logger.error('Error updating maintenance package:', error);
      res.status(500).json({ success: false, error: 'Failed to update package' });
    }
  }

  async deletePackage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      await maintenancePackageService.deletePackage(id, tenantId);
      res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
      Logger.error('Error deleting maintenance package:', error);
      res.status(500).json({ success: false, error: 'Failed to delete package' });
    }
  }
}
