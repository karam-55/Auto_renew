import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import prisma from '../../../config/database';
import { logAuditFromRequest } from '../../../middleware/audit.middleware';

export class RolesController {
  // GET /api/roles
  getAllRoles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const roles = await prisma.role.findMany({
        where: { tenantId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      Logger.error('Get roles error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch roles',
      });
    }
  };

  // GET /api/roles/:id
  getRoleById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const role = await prisma.role.findFirst({
        where: { id, tenantId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          employees: {
            select: {
              id: true,
              fullNameAr: true,
              fullNameEn: true,
              employeeCode: true,
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
        data: role,
      });
    } catch (error) {
      Logger.error('Get role error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch role',
      });
    }
  };

  // POST /api/roles
  createRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { name, description, permissionIds } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Role name is required',
        });
        return;
      }

      // Check if role name already exists for tenant
      const existingRole = await prisma.role.findFirst({
        where: {
          tenantId,
          name,
        },
      });

      if (existingRole) {
        res.status(400).json({
          success: false,
          error: 'Role with this name already exists',
        });
        return;
      }

      const role = await prisma.role.create({
        data: {
          tenantId,
          name,
          description,
          ...(permissionIds && {
            permissions: {
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            },
          }),
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Log role creation
      logAuditFromRequest(req, 'ROLE_CREATED', 'Role', role.id, null, role);

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      Logger.error('Create role error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create role',
      });
    }
  };

  // PUT /api/roles/:id
  updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const { name, description, permissionIds } = req.body;

      // Check if role exists and belongs to tenant
      const existingRole = await prisma.role.findFirst({
        where: { id, tenantId },
      });

      if (!existingRole) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      // Check if new name conflicts with existing role
      if (name && name !== existingRole.name) {
        const nameConflict = await prisma.role.findFirst({
          where: {
            tenantId,
            name,
          },
        });

        if (nameConflict) {
          res.status(400).json({
            success: false,
            error: 'Role with this name already exists',
          });
          return;
        }
      }

      // Update role
      const role = await prisma.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(permissionIds && {
            permissions: {
              deleteMany: {},
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            },
          }),
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Log role update
      logAuditFromRequest(req, 'ROLE_UPDATED', 'Role', id, existingRole, role);

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      Logger.error('Update role error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update role',
      });
    }
  };

  // DELETE /api/roles/:id
  deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      // Check if role exists and belongs to tenant
      const existingRole = await prisma.role.findFirst({
        where: { id, tenantId },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      });

      if (!existingRole) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      // Prevent deletion if role has employees
      if (existingRole._count.employees > 0) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete role with assigned employees',
        });
        return;
      }

      await prisma.role.delete({
        where: { id },
      });

      // Log role deletion
      logAuditFromRequest(req, 'ROLE_DELETED', 'Role', id, existingRole, null);

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete role error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete role',
      });
    }
  };

  // POST /api/roles/batch
  createManyRoles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { roles } = req.body;

      if (!Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({ success: false, error: 'Roles array is required' });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const roleData of roles) {
          const role = await tx.role.create({
            data: {
              tenantId,
              name: roleData.name,
              description: roleData.description || '',
              ...(roleData.permissionIds && {
                permissions: {
                  create: roleData.permissionIds.map((permissionId: string) => ({
                    permissionId,
                  })),
                },
              }),
            },
            include: {
              permissions: { include: { permission: true } },
            },
          });
          created.push(role);
        }
        return created;
      }, {
        timeout: 30000,
      });

      res.status(201).json({ success: true, count: result.length, data: result });
    } catch (error) {
      Logger.error('Batch create roles error:', error);
      res.status(500).json({ success: false, error: 'Failed to create roles' });
    }
  };
}
