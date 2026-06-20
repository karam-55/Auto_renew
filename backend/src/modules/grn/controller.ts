import { Request, Response } from 'express';
import { GRNService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class GRNController {
  private grnService: GRNService;

  constructor() {
    this.grnService = new GRNService();
  }

  createGRN = async (req: AuthRequest, res: Response) => {
    try {
      const grn = await this.grnService.createGRN(
        req.user!.tenantId,
        req.body
      );
      res.status(201).json({ grn });
    } catch (error: any) {
      Logger.error('Create GRN error:', error);
      res.status(400).json({ error: error.message || 'Failed to create GRN' });
    }
  };

  getGRNs = async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, warehouseId, purchaseOrderId, status, fromDate, toDate, search, page, limit, sortBy, sortOrder } = req.query;

      const filters: any = {};
      if (supplierId) filters.supplierId = supplierId as string;
      if (warehouseId) filters.warehouseId = warehouseId as string;
      if (purchaseOrderId) filters.purchaseOrderId = purchaseOrderId as string;
      if (status) filters.status = status as string;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      if (search) filters.search = search as string;

      const pagination: any = {};
      if (page) pagination.page = parseInt(page as string);
      if (limit) pagination.limit = parseInt(limit as string);
      if (sortBy) pagination.sortBy = sortBy as string;
      if (sortOrder) pagination.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.grnService.getGRNs(
        req.user!.tenantId,
        filters,
        pagination
      );
      res.json(result);
    } catch (error) {
      Logger.error('Get GRNs error:', error);
      res.status(500).json({ error: 'Failed to fetch GRNs' });
    }
  };

  getGRNById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const grn = await this.grnService.getGRNById(
        id,
        req.user!.tenantId
      );

      if (!grn) {
        return res.status(404).json({ error: 'Goods Receipt Note not found' });
      }

      res.json({ grn });
    } catch (error) {
      Logger.error('Get GRN error:', error);
      res.status(500).json({ error: 'Failed to fetch GRN' });
    }
  };

  updateGRN = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const grn = await this.grnService.updateGRN(
        id,
        req.user!.tenantId,
        req.body
      );
      res.json({ grn });
    } catch (error: any) {
      Logger.error('Update GRN error:', error);
      res.status(400).json({ error: error.message || 'Failed to update GRN' });
    }
  };

  deleteGRN = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.grnService.deleteGRN(id, req.user!.tenantId);
      res.json({ message: 'Goods Receipt Note deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete GRN error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete GRN' });
    }
  };

  addGRNLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const grn = await this.grnService.addGRNLine(
        id,
        req.user!.tenantId,
        req.body
      );
      res.status(201).json({ grn });
    } catch (error: any) {
      Logger.error('Add GRN line error:', error);
      res.status(400).json({ error: error.message || 'Failed to add line item' });
    }
  };

  updateGRNLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id, lineId } = req.params;
      const grn = await this.grnService.updateGRNLine(
        lineId,
        req.user!.tenantId,
        req.body
      );
      res.json({ grn });
    } catch (error: any) {
      Logger.error('Update GRN line error:', error);
      res.status(400).json({ error: error.message || 'Failed to update line item' });
    }
  };

  removeGRNLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id, lineId } = req.params;
      const grn = await this.grnService.removeGRNLine(
        lineId,
        req.user!.tenantId
      );
      res.json({ grn });
    } catch (error: any) {
      Logger.error('Remove GRN line error:', error);
      res.status(400).json({ error: error.message || 'Failed to remove line item' });
    }
  };

  completeGRN = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const grn = await this.grnService.completeGRN(
        id,
        req.user!.tenantId,
        req.user!.id
      );
      res.json({ grn });
    } catch (error: any) {
      Logger.error('Complete GRN error:', error);
      res.status(400).json({ error: error.message || 'Failed to complete GRN' });
    }
  };

  getPendingGRNs = async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;

      const pagination: any = {};
      if (page) pagination.page = parseInt(page as string);
      if (limit) pagination.limit = parseInt(limit as string);
      if (sortBy) pagination.sortBy = sortBy as string;
      if (sortOrder) pagination.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.grnService.getPendingGRNs(
        req.user!.tenantId,
        pagination
      );
      res.json(result);
    } catch (error) {
      Logger.error('Get pending GRNs error:', error);
      res.status(500).json({ error: 'Failed to fetch pending GRNs' });
    }
  };
}
