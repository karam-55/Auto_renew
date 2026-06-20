import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
}

export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // Get tenantId from header (for API calls)
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process tenant ID';
    return res.status(500).json({ error: message });
  }
};
