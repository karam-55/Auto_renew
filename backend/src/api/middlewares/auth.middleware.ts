import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { LoggingMiddleware } from './logging.middleware';

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  RECEPTIONIST = 'RECEPTIONIST',
  MECHANIC = 'MECHANIC',
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: UserRole;
    jti: string;
  };
}

export class AuthMiddleware {
  /**
   * Authenticate user using JWT access token
   */
  static authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JWTService.verifyAccessToken(token);
      
      if (!decoded) {
        LoggingMiddleware.logSecurityEvent('INVALID_TOKEN', { ip: req.ip });
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        });
        return;
      }

      req.user = {
        id: decoded.id,
        tenantId: decoded.tenantId,
        role: decoded.role as UserRole,
        jti: decoded.jti,
      };
      
      next();
    } catch (error) {
      LoggingMiddleware.logSecurityEvent('AUTH_ERROR', { ip: req.ip, error: (error as Error).message });
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }
  }

  /**
   * Authorize user based on role (RBAC)
   */
  static authorize(...allowedRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        LoggingMiddleware.logSecurityEvent('UNAUTHORIZED_ACCESS', {
          userId: req.user.id,
          role: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
        });
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
        return;
      }

      next();
    };
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  static optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JWTService.verifyAccessToken(token);
      
      if (decoded) {
        req.user = {
          id: decoded.id,
          tenantId: decoded.tenantId,
          role: decoded.role as UserRole,
          jti: decoded.jti,
        };
      }
    } catch (error) {
      // Silently fail for optional authentication
    }

    next();
  }
}
