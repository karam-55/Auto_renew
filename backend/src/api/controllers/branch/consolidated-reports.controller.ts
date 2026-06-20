import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import prisma from '../../../config/database';

export class ConsolidatedReportsController {
  // GET /api/reports/consolidated/sales
  getConsolidatedSales = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Get all branches for the tenant
      const branches = await prisma.branch.findMany({
        where: { tenantId, isActive: true },
      });

      // Calculate sales per branch
      const branchSales = await Promise.all(
        branches.map(async (branch) => {
          const invoices = await prisma.invoice.findMany({
            where: {
              tenantId,
              branchId: branch.id,
              status: 'ISSUED',
            },
          });

          const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalSYP), 0);

          return {
            branchId: branch.id,
            branchName: branch.name,
            totalSales,
            invoiceCount: invoices.length,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: branchSales,
      });
    } catch (error) {
      Logger.error('Get consolidated sales error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consolidated sales report',
      });
    }
  };

  // GET /api/reports/consolidated/profitability
  getConsolidatedProfitability = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Get all branches for the tenant
      const branches = await prisma.branch.findMany({
        where: { tenantId, isActive: true },
      });

      // Calculate profitability per branch
      const branchProfitability = await Promise.all(
        branches.map(async (branch) => {
          const invoices = await prisma.invoice.findMany({
            where: {
              tenantId,
              branchId: branch.id,
              status: 'ISSUED',
            },
          });

          const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalSYP), 0);
          // Simplified cost calculation (70% of revenue as estimated cost)
          const totalCost = totalRevenue * 0.7;
          const totalProfit = totalRevenue - totalCost;
          const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

          return {
            branchId: branch.id,
            branchName: branch.name,
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: branchProfitability,
      });
    } catch (error) {
      Logger.error('Get consolidated profitability error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consolidated profitability report',
      });
    }
  };

  // GET /api/reports/consolidated/inventory
  getConsolidatedInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Get all branches for the tenant
      const branches = await prisma.branch.findMany({
        where: { tenantId, isActive: true },
      });

      // Simplified inventory report - return 0 for now as Part-Warehouse relationship needs schema clarification
      const branchInventory = branches.map((branch: any) => ({
        branchId: branch.id,
        branchName: branch.name,
        inventoryValue: 0,
        lowStockCount: 0,
        totalParts: 0,
      }));

      res.status(200).json({
        success: true,
        data: branchInventory,
      });
    } catch (error) {
      Logger.error('Get consolidated inventory error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consolidated inventory report',
      });
    }
  };

  // GET /api/reports/consolidated/memberships
  getConsolidatedMemberships = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      // Get all branches for the tenant
      const branches = await prisma.branch.findMany({
        where: { tenantId, isActive: true },
        include: {
          customerMemberships: true,
        },
      });

      // Calculate membership stats per branch
      const branchMemberships = branches.map((branch) => {
        const now = new Date();
        const activeMemberships = branch.customerMemberships.filter(
          (m) => m.status === 'ACTIVE' && m.endDate > now
        ).length;
        const expiredMemberships = branch.customerMemberships.filter(
          (m) => m.status === 'EXPIRED' || m.endDate <= now
        ).length;

        return {
          branchId: branch.id,
          branchName: branch.name,
          activeMemberships,
          expiredMemberships,
          totalMemberships: branch.customerMemberships.length,
        };
      });

      res.status(200).json({
        success: true,
        data: branchMemberships,
      });
    } catch (error) {
      Logger.error('Get consolidated memberships error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate consolidated memberships report',
      });
    }
  };
}
