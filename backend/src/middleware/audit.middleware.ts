import { Request, Response, NextFunction } from 'express';
import { Logger } from '../infrastructure/logging/logger';
import { AuditService } from '../services/audit.service';

declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        userId?: string;
        branchId?: string;
        ipAddress?: string;
        userAgent?: string;
      };
    }
  }
}

/**
 * Middleware to capture audit context from request
 * This should be placed after authentication and branch isolation middleware
 */
export function auditContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract user ID from session (set by auth middleware)
  const userId = (req as any).user?.id || (req as any).userId;
  
  // Extract branch ID from branch isolation middleware
  const branchId = (req as any).branchId;
  
  // Extract IP address and user agent
  const ipAddress = AuditService.extractIpAddress(req);
  const userAgent = AuditService.extractUserAgent(req);
  
  // Store in request for use in controllers
  req.auditContext = {
    userId,
    branchId,
    ipAddress,
    userAgent,
  };
  
  next();
}

/**
 * Helper function to log audit action with context from request
 */
export function logAuditFromRequest(
  req: Request,
  action: string,
  entity: string,
  entityId: string,
  before?: any,
  after?: any
) {
  const context = req.auditContext;
  
  if (!context) {
    Logger.warn('Audit context not found in request');
    return;
  }
  
  AuditService.logAction({
    userId: context.userId,
    branchId: context.branchId,
    action,
    entity,
    entityId,
    before,
    after,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}
