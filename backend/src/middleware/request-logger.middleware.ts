import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { Logger } from '../infrastructure/logging/logger';

/**
 * Request Logger Middleware
 * Logs all incoming requests with timing, status, and user info.
 * Non-blocking and lightweight.
 */

interface RequestLogEntry {
  timestamp: string;
  method: string;
  url: string;
  originalUrl: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  statusCode: number;
  duration: number;
  contentLength?: number;
}

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  const requestId = (req as any).requestId || `req_${Date.now()}_${randomSuffix}`;
  (req as any).requestId = requestId;

  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logEntry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenantId,
      requestId,
      statusCode,
      duration,
      contentLength: res.getHeader('content-length') as number | undefined,
    };

    // Log based on status code
    const logMessage = `[${logEntry.method}] ${logEntry.originalUrl} - ${logEntry.statusCode} - ${logEntry.duration}ms`;
    if (statusCode >= 500) {
      Logger.error('Server error response', new Error(`Status ${statusCode}`), {
        ...logEntry,
      });
    } else if (statusCode >= 400) {
      Logger.warn(logMessage, logEntry);
    } else if (duration > 1000) {
      Logger.warn(`[SLOW] ${logMessage}`, logEntry);
    } else {
      Logger.info(logMessage, logEntry);
    }

    return originalEnd(chunk, encoding, cb);
  };

  next();
}

/**
 * Error request logger - logs request details before error handling
 */
export function errorRequestLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId;
  Logger.error('Request error', err, {
    method: req.method,
    url: req.originalUrl,
    requestId,
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
    ip: req.ip,
  });
  next(err);
}
