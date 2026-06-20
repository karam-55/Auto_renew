import { Request, Response } from 'express';
import { SupplierService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class SupplierController {
  private supplierService: SupplierService;

  constructor() {
    this.supplierService = new SupplierService();
  }

  createSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const supplier = await this.supplierService.createSupplier(req.user!.tenantId, req.body);
      res.status(201).json({ supplier });
    } catch (error: any) {
      Logger.error('Create supplier error', error);
      res.status(400).json({ error: error.message || 'Failed to create supplier' });
    }
  };

  getSuppliers = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.query;
      const filters = status ? { status: status as any } : undefined;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;
      const [suppliers, total] = await Promise.all([
        this.supplierService.getSuppliers(req.user!.tenantId, filters, skip, limit),
        this.supplierService.getSuppliersCount(req.user!.tenantId, filters),
      ]);
      res.json({
        data: suppliers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      Logger.error('Get suppliers error', error);
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  };

  getSupplierById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const supplier = await this.supplierService.getSupplierById(id, req.user!.tenantId);

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      res.json({ supplier });
    } catch (error) {
      Logger.error('Get supplier error', error);
      res.status(500).json({ error: 'Failed to fetch supplier' });
    }
  };

  updateSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const supplier = await this.supplierService.updateSupplier(id, req.user!.tenantId, req.body);
      res.json({ supplier });
    } catch (error: any) {
      Logger.error('Update supplier error', error);
      res.status(400).json({ error: error.message || 'Failed to update supplier' });
    }
  };

  deleteSupplier = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.supplierService.deleteSupplier(id, req.user!.tenantId);
      res.json({ message: 'Supplier deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete supplier error', error);
      res.status(400).json({ error: error.message || 'Failed to delete supplier' });
    }
  };

  searchSuppliers = async (req: AuthRequest, res: Response) => {
    try {
      const { query } = req.params;
      if (!query) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const suppliers = await this.supplierService.searchSuppliers(req.user!.tenantId, query);
      res.json({ suppliers });
    } catch (error) {
      Logger.error('Search suppliers error', error);
      res.status(500).json({ error: 'Failed to search suppliers' });
    }
  };
}
