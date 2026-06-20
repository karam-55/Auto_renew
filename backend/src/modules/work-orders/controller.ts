import { Request, Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import workOrderService from './service';
import { Logger } from '../../infrastructure/logging/logger';

export class WorkOrderController {
  async getAllWorkOrders(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { status, priority, bookingId, search, page, limit } = req.query;

      const result = await workOrderService.getAllWorkOrders(tenantId, {
        status: status as string,
        priority: priority as string,
        bookingId: bookingId as string,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({ success: true, ...result });
    } catch (error: any) {
      Logger.error('Get all work orders error', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch work orders' },
      });
    }
  }

  async getWorkOrderById(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const workOrder = await workOrderService.getWorkOrderById(tenantId, id);
      res.json({ success: true, data: workOrder });
    } catch (error: any) {
      Logger.error('Get work order by ID error', error);
      if (error.message === 'Work order not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Work order not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch work order' },
      });
    }
  }

  async createWorkOrder(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const workOrder = await workOrderService.createWorkOrder(tenantId, {
        tenantId,
        ...req.body,
      });

      res.status(201).json({ success: true, data: workOrder });
    } catch (error: any) {
      Logger.error('Create work order error', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create work order' },
      });
    }
  }

  async updateWorkOrder(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const workOrder = await workOrderService.updateWorkOrder(tenantId, id, req.body);
      res.json({ success: true, data: workOrder });
    } catch (error: any) {
      Logger.error('Update work order error', error);
      if (error.message === 'Work order not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Work order not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update work order' },
      });
    }
  }

  async deleteWorkOrder(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await workOrderService.deleteWorkOrder(tenantId, id);
      res.json({ success: true, message: 'Work order deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete work order error', error);
      if (error.message === 'Work order not found') {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Work order not found' },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete work order' },
      });
    }
  }

  async getWorkOrderStats(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const stats = await workOrderService.getWorkOrderStats(tenantId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      Logger.error('Get work order stats error', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch work order stats' },
      });
    }
  }
}

export default new WorkOrderController();
