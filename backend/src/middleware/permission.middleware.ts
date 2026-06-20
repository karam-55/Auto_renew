import { Request, Response, NextFunction } from 'express';
import { Logger } from '../infrastructure/logging/logger';
import { AuthRequest } from '../shared/middlewares/auth';
import prisma from '../config/database';

/**
 * Middleware factory to check if user has specific permission
 * @param permissionKey - The permission key to check (e.g., 'manage_inventory')
 */
export const requirePermission = (permissionKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // OWNER role has all permissions (super-admin)
      if (user.role === 'OWNER') {
        next();
        return;
      }

      // Request-level cache: skip DB query if permissions already loaded
      if (req.permissions && req.permissions.length > 0) {
        const normalizedKey = permissionKey.toLowerCase();
        const hasPermission = req.permissions.some(
          (p) => p.toLowerCase() === normalizedKey
        );
        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: `Permission denied: ${permissionKey}`,
          });
        }
        next();
        return;
      }

      // Optimized query: fetch only permission keys via RolePermission relation
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            employees: {
              some: { userId: user.id },
            },
          },
        },
        include: {
          permission: {
            select: { key: true },
          },
        },
      });

      if (!rolePermissions || rolePermissions.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No role assigned to user',
        });
      }

      const permissionKeys = rolePermissions.map((rp) => rp.permission.key);

      // Case-insensitive check
      const normalizedKey = permissionKey.toLowerCase();
      const hasPermission = permissionKeys.some(
        (key) => key.toLowerCase() === normalizedKey
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: ${permissionKey}`,
        });
      }

      // Attach role permissions to request for later use (cache for this request)
      req.permissions = permissionKeys;
      next();
    } catch (error) {
      Logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param permissionKeys - Array of permission keys (user needs at least one)
 */
export const requireAnyPermission = (permissionKeys: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // OWNER role has all permissions (super-admin)
      if (user.role === 'OWNER') {
        next();
        return;
      }

      // Request-level cache
      if (req.permissions && req.permissions.length > 0) {
        const normalizedRequired = permissionKeys.map((k) => k.toLowerCase());
        const hasAnyPermission = req.permissions.some((p) =>
          normalizedRequired.includes(p.toLowerCase())
        );
        if (!hasAnyPermission) {
          return res.status(403).json({
            success: false,
            error: `Permission denied: requires one of ${permissionKeys.join(', ')}`,
          });
        }
        next();
        return;
      }

      // Optimized query
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: {
            employees: {
              some: { userId: user.id },
            },
          },
        },
        include: {
          permission: {
            select: { key: true },
          },
        },
      });

      if (!rolePermissions || rolePermissions.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No role assigned to user',
        });
      }

      const userPermissions = rolePermissions.map((rp) => rp.permission.key);
      const normalizedRequired = permissionKeys.map((k) => k.toLowerCase());
      const hasAnyPermission = userPermissions.some((p) =>
        normalizedRequired.includes(p.toLowerCase())
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: requires one of ${permissionKeys.join(', ')}`,
        });
      }

      req.permissions = userPermissions;
      next();
    } catch (error) {
      Logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

/**
 * Middleware to check if user has all specified permissions
 * @param permissionKeys - Array of permission keys (user needs all of them)
 */
export const requireAllPermissions = (permissionKeys: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      // OWNER role has all permissions (super-admin)
      if (user.role === 'OWNER') {
        next();
        return;
      }

      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!employee || !employee.role) {
        return res.status(403).json({
          success: false,
          error: 'No role assigned to user',
        });
      }

      const userPermissions = employee.role.permissions.map((rp) => rp.permission.key);
      const hasAllPermissions = permissionKeys.every((key) => userPermissions.includes(key));

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: `Permission denied: requires all of ${permissionKeys.join(', ')}`,
        });
      }

      req.permissions = userPermissions;
      next();
    } catch (error) {
      Logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions',
      });
    }
  };
};

// Extend Express Request type to include permissions
declare module 'express-serve-static-core' {
  interface Request {
    permissions?: string[];
  }
}
