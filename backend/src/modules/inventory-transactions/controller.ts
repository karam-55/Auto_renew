import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { InventoryTransactionService } from './service';
import { AuthRequest } from '../../shared/middlewares/auth';
import {
  InventoryTransactionFilters,
  PaginationParams,
  ConsumePartDto,
  TransactionType,
} from './types';
import { logAuditFromRequest } from '../../middleware/audit.middleware';

export class InventoryTransactionController {
  private inventoryTransactionService: InventoryTransactionService;

  constructor() {
    this.inventoryTransactionService = new InventoryTransactionService();
  }

  createInventoryTransaction = async (req: AuthRequest, res: Response) => {
    try {
      const transaction = await this.inventoryTransactionService.createInventoryTransaction(
        req.user!.tenantId,
        req.body
      );
      
      // Log inventory transaction creation
      logAuditFromRequest(req, 'INVENTORY_TRANSACTION_CREATED', 'InventoryTransaction', transaction.id, null, transaction);
      
      res.status(201).json({ transaction });
    } catch (error: any) {
      Logger.error('Create inventory transaction error:', error);
      res.status(400).json({ error: error.message || 'Failed to create inventory transaction' });
    }
  };

  getInventoryTransactions = async (req: AuthRequest, res: Response) => {
    try {
      const filters: InventoryTransactionFilters = {
        partId: req.query.partId as string | undefined,
        warehouseId: req.query.warehouseId as string | undefined,
        transactionType: req.query.transactionType as any,
        referenceType: req.query.referenceType as string | undefined,
        referenceId: req.query.referenceId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await this.inventoryTransactionService.getInventoryTransactions(
        req.user!.tenantId,
        filters,
        pagination
      );
      res.json(result);
    } catch (error: any) {
      Logger.error('Get inventory transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch inventory transactions' });
    }
  };

  getInventoryTransactionById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const transaction = await this.inventoryTransactionService.getInventoryTransactionById(
        id,
        req.user!.tenantId
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Inventory transaction not found' });
      }

      res.json({ transaction });
    } catch (error: any) {
      Logger.error('Get inventory transaction error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch inventory transaction' });
    }
  };

  updateInventoryTransaction = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldTransaction = await this.inventoryTransactionService.getInventoryTransactionById(id, req.user!.tenantId);
      const transaction = await this.inventoryTransactionService.updateInventoryTransaction(
        id,
        req.user!.tenantId,
        req.body
      );
      
      // Log inventory transaction update
      logAuditFromRequest(req, 'INVENTORY_TRANSACTION_UPDATED', 'InventoryTransaction', id, oldTransaction, transaction);
      
      res.json({ transaction });
    } catch (error: any) {
      Logger.error('Update inventory transaction error:', error);
      res.status(400).json({ error: error.message || 'Failed to update inventory transaction' });
    }
  };

  deleteInventoryTransaction = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const oldTransaction = await this.inventoryTransactionService.getInventoryTransactionById(id, req.user!.tenantId);
      await this.inventoryTransactionService.deleteInventoryTransaction(id, req.user!.tenantId);
      
      // Log inventory transaction deletion
      logAuditFromRequest(req, 'INVENTORY_TRANSACTION_DELETED', 'InventoryTransaction', id, oldTransaction, null);
      
      res.json({ message: 'Inventory transaction deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete inventory transaction error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete inventory transaction' });
    }
  };

  getPartHistory = async (req: AuthRequest, res: Response) => {
    try {
      const { partId } = req.params;

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await this.inventoryTransactionService.getPartHistory(
        req.user!.tenantId,
        partId,
        pagination
      );
      res.json(result);
    } catch (error: any) {
      Logger.error('Get part history error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch part history' });
    }
  };

  getWarehouseTransactions = async (req: AuthRequest, res: Response) => {
    try {
      const { warehouseId } = req.params;

      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await this.inventoryTransactionService.getWarehouseTransactions(
        req.user!.tenantId,
        warehouseId,
        pagination
      );
      res.json(result);
    } catch (error: any) {
      Logger.error('Get warehouse transactions error:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch warehouse transactions' });
    }
  };

  consumeParts = async (req: AuthRequest, res: Response) => {
    try {
      const { partId, quantity, bookingId, warehouseId, notes }: ConsumePartDto = req.body;

      if (!partId || !quantity || !bookingId) {
        return res.status(400).json({
          error: 'partId, quantity, and bookingId are required',
        });
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'quantity must be a positive number' });
      }

      const transaction = await this.inventoryTransactionService.createConsumptionTransaction(
        req.user!.tenantId,
        partId,
        quantity,
        bookingId,
        warehouseId,
        notes
      );
      res.status(201).json({ transaction });
    } catch (error: any) {
      Logger.error('Consume parts error:', error);
      res.status(400).json({ error: error.message || 'Failed to consume parts' });
    }
  };
}
