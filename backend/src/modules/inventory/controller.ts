import { Request, Response } from 'express';
import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import { AuthRequest } from '../../shared/middlewares/auth';

export class InventoryController {
  /**
   * Get inventory dashboard/overview
   */
  getInventoryOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Get counts
      const totalParts = await prisma.part.count({
        where: { tenantId, deletedAt: null },
      });

      // Get all parts to check low stock in JS (Prisma can't compare two fields directly)
      const allParts = await prisma.part.findMany({
        where: { tenantId, deletedAt: null },
        select: { quantity: true, minQuantity: true },
      });
      const lowStockParts = allParts.filter(p => p.quantity <= p.minQuantity).length;

      const totalWarehouses = await prisma.warehouse.count({
        where: { tenantId, deletedAt: null },
      });

      const totalSuppliers = await prisma.supplier.count({
        where: { tenantId, deletedAt: null },
      });

      // Get recent transactions
      const recentTransactions = await prisma.inventoryTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          part: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      });

      // Get recent purchase orders
      const recentPurchaseOrders = await prisma.purchaseOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          supplier: { select: { id: true, name: true } },
        },
      });

      // Get stock value (approximate)
      const parts = await prisma.part.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          quantity: true,
          costSYP: true,
        },
      });

      const totalStockValue = parts.reduce((sum, part) => {
        return sum + ((part.quantity ?? 0) * (part.costSYP?.toNumber() ?? 0));
      }, 0);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalParts,
            lowStockParts,
            totalWarehouses,
            totalSuppliers,
            totalStockValue,
          },
          recentTransactions,
          recentPurchaseOrders,
        },
      });
    } catch (error) {
      Logger.error('Get inventory overview error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get inventory overview',
      });
    }
  };

  /**
   * Get low stock alerts
   */
  getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const allStockItems = await prisma.part.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { quantity: 'asc' },
      });
      const lowStockItems = allStockItems.filter(p => p.quantity <= p.minQuantity);

      res.status(200).json({
        success: true,
        data: lowStockItems,
      });
    } catch (error) {
      Logger.error('Get low stock alerts error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get low stock alerts',
      });
    }
  };

  /**
   * Get stock levels by warehouse
   */
  getStockByWarehouse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const warehouses = await prisma.warehouse.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          inventoryTransactions: {
            include: {
              part: { select: { id: true, name: true, partNumber: true } },
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      Logger.error('Get stock by warehouse error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stock by warehouse',
      });
    }
  };
}
