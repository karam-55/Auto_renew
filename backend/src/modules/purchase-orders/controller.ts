import { Request, Response } from 'express';
import { PurchaseOrderService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';

export class PurchaseOrderController {
  private purchaseOrderService: PurchaseOrderService;

  constructor() {
    this.purchaseOrderService = new PurchaseOrderService();
  }

  createPurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const purchaseOrder = await this.purchaseOrderService.createPurchaseOrder(
        req.user!.tenantId,
        req.body
      );
      res.status(201).json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Create purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to create purchase order' });
    }
  };

  getPurchaseOrders = async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, status, fromDate, toDate, search, page, limit, sortBy, sortOrder } = req.query;

      const filters: any = {};
      if (supplierId) filters.supplierId = supplierId as string;
      if (status) filters.status = status as string;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      if (search) filters.search = search as string;

      const pagination: any = {};
      if (page) pagination.page = parseInt(page as string);
      if (limit) pagination.limit = parseInt(limit as string);
      if (sortBy) pagination.sortBy = sortBy as string;
      if (sortOrder) pagination.sortOrder = sortOrder as 'asc' | 'desc';

      const result = await this.purchaseOrderService.getPurchaseOrders(
        req.user!.tenantId,
        filters,
        pagination
      );
      res.json(result);
    } catch (error) {
      Logger.error('Get purchase orders error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  };

  getPurchaseOrderById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.getPurchaseOrderById(
        id,
        req.user!.tenantId
      );

      if (!purchaseOrder) {
        return res.status(404).json({ error: 'Purchase order not found' });
      }

      res.json({ purchaseOrder });
    } catch (error) {
      Logger.error('Get purchase order error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase order' });
    }
  };

  updatePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.updatePurchaseOrder(
        id,
        req.user!.tenantId,
        req.body
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Update purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to update purchase order' });
    }
  };

  deletePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.purchaseOrderService.deletePurchaseOrder(id, req.user!.tenantId);
      res.json({ message: 'Purchase order deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete purchase order' });
    }
  };

  addPurchaseOrderLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.addPurchaseOrderLine(
        id,
        req.user!.tenantId,
        req.body
      );
      res.status(201).json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Add purchase order line error:', error);
      res.status(400).json({ error: error.message || 'Failed to add line item' });
    }
  };

  updatePurchaseOrderLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id, lineId } = req.params;
      const purchaseOrder = await this.purchaseOrderService.updatePurchaseOrderLine(
        lineId,
        req.user!.tenantId,
        req.body
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Update purchase order line error:', error);
      res.status(400).json({ error: error.message || 'Failed to update line item' });
    }
  };

  removePurchaseOrderLine = async (req: AuthRequest, res: Response) => {
    try {
      const { id, lineId } = req.params;
      const purchaseOrder = await this.purchaseOrderService.removePurchaseOrderLine(
        lineId,
        req.user!.tenantId
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Remove purchase order line error:', error);
      res.status(400).json({ error: error.message || 'Failed to remove line item' });
    }
  };

  approvePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.approvePurchaseOrder(
        id,
        req.user!.tenantId,
        req.user!.id
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Approve purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to approve purchase order' });
    }
  };

  cancelPurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.cancelPurchaseOrder(
        id,
        req.user!.tenantId
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Cancel purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to cancel purchase order' });
    }
  };

  receivePurchaseOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const purchaseOrder = await this.purchaseOrderService.receivePurchaseOrder(
        id,
        req.user!.tenantId,
        req.user!.id
      );
      res.json({ purchaseOrder });
    } catch (error: any) {
      Logger.error('Receive purchase order error:', error);
      res.status(400).json({ error: error.message || 'Failed to receive purchase order' });
    }
  };
}
