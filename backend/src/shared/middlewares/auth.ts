import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Logger } from '../../infrastructure/logging/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    username: string;
    branchId?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    Logger.debug('=== AUTHENTICATE MIDDLEWARE ===');
    Logger.debug('Method: ' + req.method);
    Logger.debug('URL: ' + req.url);
    // Deliberately skip logging headers and token to avoid leaking sensitive data
    
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      Logger.debug('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    Logger.debug('Token found (truncated)');

    if (!process.env.JWT_SECRET) {
      Logger.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      tenantId: string;
      role: string;
      username: string;
    };

    Logger.debug('Token decoded successfully', { userId: decoded.id, tenantId: decoded.tenantId });
    req.user = decoded;
    Logger.debug('User set in request, calling next()');
    next();
  } catch (error) {
    Logger.debug('Token verification failed');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRoleUpper = req.user.role.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());

    if (!allowedRoles.includes(userRoleUpper)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
