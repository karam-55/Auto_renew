import { Request, Response } from 'express';
import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import { AuthRequest } from '../../shared/middlewares/auth';

export class TenantController {
  /**
   * Get all tenants
   */
  getAllTenants = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true,
          domain: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: tenants,
      });
    } catch (error) {
      Logger.error('Get all tenants error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tenants',
      });
    }
  };

  /**
   * Get tenant by ID
   */
  getTenantById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const tenant = await prisma.tenant.findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          name: true,
          nameAr: true,
          nameEn: true,
          domain: true,
          logoUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              customers: true,
              bookings: true,
              invoices: true,
              employees: true,
            },
          },
        },
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      Logger.error('Get tenant by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tenant',
      });
    }
  };

  /**
   * Create new tenant
   */
  createTenant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, nameAr, nameEn, domain, logoUrl } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Name is required',
        });
        return;
      }

      const tenant = await prisma.tenant.create({
        data: {
          name,
          nameAr,
          nameEn,
          domain,
          logoUrl,
        },
      });

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      Logger.error('Create tenant error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tenant',
      });
    }
  };

  /**
   * Update tenant
   */
  updateTenant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, nameAr, nameEn, domain, logoUrl, isActive } = req.body;

      const tenant = await prisma.tenant.update({
        where: { id },
        data: {
          name,
          nameAr,
          nameEn,
          domain,
          logoUrl,
          isActive,
        },
      });

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      Logger.error('Update tenant error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update tenant',
      });
    }
  };

  /**
   * Delete tenant (hard delete)
   */
  deleteTenant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.tenant.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete tenant error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete tenant',
      });
    }
  };

  /**
   * Get tenant stats
   */
  getTenantStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const tenant = await prisma.tenant.findFirst({
        where: { id, deletedAt: null },
        include: {
          _count: {
            select: {
              users: true,
              customers: true,
              bookings: true,
              invoices: true,
              employees: true,
              warehouses: true,
              suppliers: true,
            },
          },
        },
      });

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: 'Tenant not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: tenant.id,
          name: tenant.name,
          isActive: tenant.isActive,
          counts: tenant._count,
        },
      });
    } catch (error) {
      Logger.error('Get tenant stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tenant stats',
      });
    }
  };
}
