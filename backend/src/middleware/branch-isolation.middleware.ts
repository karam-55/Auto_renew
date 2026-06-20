import { Request, Response, NextFunction } from 'express';
import { Logger } from '../infrastructure/logging/logger';
import prisma from '../config/database';

export interface BranchContext {
  tenantId: string;
  branchId?: string;
  isAdmin: boolean;
  accessibleBranchIds: string[];
}

declare global {
  namespace Express {
    interface Request {
      branchContext?: BranchContext;
    }
  }
}

export async function branchIsolationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const tenantId = (req as any).tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with employee data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get employee record separately
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        branch: true,
        branches: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Determine accessible branches based on role
    let accessibleBranchIds: string[] = [];
    let currentBranchId: string | undefined;
    let isAdmin = false;

    if (user.role === 'OWNER') {
      // Admins can access all branches
      isAdmin = true;
      const branches = await prisma.branch.findMany({
        where: { tenantId, isActive: true },
        select: { id: true },
      });
      accessibleBranchIds = branches.map((b: { id: string }) => b.id);
      
      // Admin can switch branches - use branch from header or default to first active branch
      const headerBranchId = req.headers['x-branch-id'] as string;
      if (headerBranchId && accessibleBranchIds.includes(headerBranchId)) {
        currentBranchId = headerBranchId;
      } else {
        // Default to first active branch
        const firstBranch = await prisma.branch.findFirst({
          where: { tenantId, isActive: true },
        });
        currentBranchId = firstBranch?.id;
      }
    } else if (employee) {
      // Non-admin users are limited to their assigned branches
      // Check if employee has multiple branch assignments via EmployeeBranch
      if (employee.branches && employee.branches.length > 0) {
        accessibleBranchIds = employee.branches.map((eb: any) => eb.branchId);
        // Use primary branch or first assigned branch as current
        const primaryAssignment = employee.branches.find((eb: any) => eb.isPrimary);
        currentBranchId = primaryAssignment?.branchId || employee.branches[0].branchId;
      } else if (employee.branchId) {
        // Fallback to single branch assignment
        currentBranchId = employee.branchId;
        accessibleBranchIds = [employee.branchId];
      } else {
        // Employee without branch assignment - can't access any branch data
        accessibleBranchIds = [];
      }
    } else {
      // User without employee record
      accessibleBranchIds = [];
    }

    // Set branch context on request
    req.branchContext = {
      tenantId,
      branchId: currentBranchId,
      isAdmin,
      accessibleBranchIds,
    };

    next();
  } catch (error) {
    Logger.error('Branch isolation middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireBranchAccess(req: Request, res: Response, next: NextFunction) {
  const branchContext = req.branchContext;

  if (!branchContext) {
    return res.status(401).json({ error: 'Branch context not found' });
  }

  if (!branchContext.branchId && !branchContext.isAdmin) {
    return res.status(403).json({ error: 'No branch assigned' });
  }

  next();
}

export function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  const branchContext = req.branchContext;

  if (!branchContext || !branchContext.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

export function filterByBranch<T extends { branchId?: string }>(items: T[], branchId?: string): T[] {
  if (!branchId) return items;
  return items.filter(item => item.branchId === branchId);
}

export function filterByAccessibleBranches<T extends { branchId?: string }>(
  items: T[],
  accessibleBranchIds: string[]
): T[] {
  if (accessibleBranchIds.length === 0) return [];
  return items.filter(item => 
    !item.branchId || accessibleBranchIds.includes(item.branchId)
  );
}
