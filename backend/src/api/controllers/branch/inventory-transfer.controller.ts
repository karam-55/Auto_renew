import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { InventoryTransferService } from '../../../modules/inventory-transfer/inventory-transfer.service';

const inventoryTransferService = new InventoryTransferService();

export class InventoryTransferController {
  async createTransfer(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      const branchId = req.branchContext?.branchId;
      
      if (!tenantId || !branchId) {
        return res.status(400).json({ error: 'Tenant ID and Branch ID required' });
      }

      const transferData = {
        ...req.body,
        tenantId,
        branchId,
      };

      const transfer = await inventoryTransferService.createTransfer(transferData);
      res.status(201).json({ success: true, data: transfer });
    } catch (error: any) {
      Logger.error('Error creating transfer:', error);
      res.status(400).json({ error: error.message || 'Failed to create transfer' });
    }
  }

  async getTransferById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfer = await inventoryTransferService.getTransferById(id, tenantId);
      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      res.json({ success: true, data: transfer });
    } catch (error) {
      Logger.error('Error fetching transfer:', error);
      res.status(500).json({ error: 'Failed to fetch transfer' });
    }
  }

  async getAllTransfers(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      const branchId = req.branchContext?.branchId;
      const status = req.query.status as any;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfers = await inventoryTransferService.getAllTransfers(tenantId, branchId, status);
      res.json({ success: true, data: transfers });
    } catch (error) {
      Logger.error('Error fetching transfers:', error);
      res.status(500).json({ error: 'Failed to fetch transfers' });
    }
  }

  async approveTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfer = await inventoryTransferService.approveTransfer(id, tenantId);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      Logger.error('Error approving transfer:', error);
      res.status(400).json({ error: error.message || 'Failed to approve transfer' });
    }
  }

  async shipTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfer = await inventoryTransferService.shipTransfer(id, tenantId);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      Logger.error('Error shipping transfer:', error);
      res.status(400).json({ error: error.message || 'Failed to ship transfer' });
    }
  }

  async receiveTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfer = await inventoryTransferService.receiveTransfer(id, tenantId);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      Logger.error('Error receiving transfer:', error);
      res.status(400).json({ error: error.message || 'Failed to receive transfer' });
    }
  }

  async cancelTransfer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const transfer = await inventoryTransferService.cancelTransfer(id, tenantId);
      res.json({ success: true, data: transfer });
    } catch (error: any) {
      Logger.error('Error cancelling transfer:', error);
      res.status(400).json({ error: error.message || 'Failed to cancel transfer' });
    }
  }
}
