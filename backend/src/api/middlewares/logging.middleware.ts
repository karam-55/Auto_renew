import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infrastructure/logging/logger';

/**
 * Logging Middleware
 * Handles request logging, error logging, and slow request logging
 */
export class LoggingMiddleware {
  private static SLOW_REQUEST_THRESHOLD = 300; // 300ms

  /**
   * Request logging middleware
   * Logs method, path, duration, status, and userId
   */
  static requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const userId = (req as any).user?.id || 'anonymous';

      // Log request start
      Logger.debug(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${userId}`);

      // Capture original end function
      const originalEnd = res.end.bind(res);

      // Override end function to log response
      res.end = function (chunk?: any, encoding?: any, cb?: any) {
        const duration = Date.now() - startTime;
        const status = res.statusCode;

        Logger.debug(
          `[${new Date().toISOString()}] ${req.method} ${req.path} - Status: ${status} - Duration: ${duration}ms - User: ${userId}`
        );

        // Log slow requests
        if (duration > LoggingMiddleware.SLOW_REQUEST_THRESHOLD) {
          Logger.warn(
            `[SLOW REQUEST] ${req.method} ${req.path} - Duration: ${duration}ms - User: ${userId}`
          );
        }

        return originalEnd(chunk, encoding, cb);
      };

      next();
    };
  }

  /**
   * Error logging middleware
   * Logs errors with stack trace and userId
   */
  static errorLogger() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      const userId = (req as any).user?.id || 'anonymous';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      Logger.error(
        `[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${userId} - IP: ${ip}`
      );
      Logger.error(`Error Message: ${err.message}`);
      Logger.error(`Error Stack: ${err.stack}`);

      // Log additional error details if available
      if (err.name) {
        Logger.error(`Error Name: ${err.name}`);
      }

      next(err);
    };
  }

  /**
   * Slow request logging middleware
   * Logs requests that take longer than threshold
   */
  static slowRequestLogger(thresholdMs: number = 300) {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const userId = (req as any).user?.id || 'anonymous';

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        if (duration > thresholdMs) {
          Logger.warn(
            `[SLOW REQUEST] ${new Date().toISOString()} - ${req.method} ${req.path} - Duration: ${duration}ms - User: ${userId} - Status: ${res.statusCode}`
          );
        }
      });

      next();
    };
  }

  /**
   * Combined logging middleware
   * Combines request, error, and slow request logging
   */
  static combinedLogger() {
    return [
      this.requestLogger(),
      this.slowRequestLogger(this.SLOW_REQUEST_THRESHOLD),
      this.errorLogger(),
    ];
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(event: string, userId: string, details?: any): void {
    Logger.info(
      `[AUTH] ${new Date().toISOString()} - Event: ${event} - User: ${userId} - Details: ${JSON.stringify(details || {})}`
    );
  }

  /**
   * Log security events
   */
  static logSecurityEvent(event: string, details: any): void {
    Logger.warn(
      `[SECURITY] ${new Date().toISOString()} - Event: ${event} - Details: ${JSON.stringify(details)}`
    );
  }

  /**
   * Log cache events
   */
  static logCacheEvent(event: string, key: string, details?: any): void {
    Logger.debug(
      `[CACHE] ${new Date().toISOString()} - Event: ${event} - Key: ${key} - Details: ${JSON.stringify(details || {})}`
    );
  }
}
