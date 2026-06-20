import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import prisma from '../../../config/database';
import { logAuditFromRequest } from '../../../middleware/audit.middleware';

export class PermissionsController {
  // GET /api/permissions
  getAllPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { key: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      Logger.error('Get permissions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      });
    }
  };

  // POST /api/roles/:roleId/permissions
  assignPermissionsToRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const tenantId = req.user!.tenantId;
      const { permissionIds } = req.body;

      if (!Array.isArray(permissionIds)) {
        res.status(400).json({
          success: false,
          error: 'permissionIds must be an array',
        });
        return;
      }

      // Check if role exists and belongs to tenant
      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId },
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      // Verify all permission IDs exist
      const permissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        res.status(400).json({
          success: false,
          error: 'One or more permission IDs are invalid',
        });
        return;
      }

      // Delete existing role permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new role permissions
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId,
          permissionId,
        })),
      });

      // Return updated role with permissions
      const updatedRole = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Log role permissions update
      logAuditFromRequest(req, 'ROLE_PERMISSIONS_UPDATED', 'Role', roleId, role, updatedRole);

      res.status(200).json({
        success: true,
        data: updatedRole,
      });
    } catch (error) {
      Logger.error('Assign permissions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign permissions',
      });
    }
  };

  // GET /api/roles/:roleId/permissions
  getRolePermissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const tenantId = req.user!.tenantId;

      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: role.permissions.map((rp) => rp.permission),
      });
    } catch (error) {
      Logger.error('Get role permissions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch role permissions',
      });
    }
  };
}
