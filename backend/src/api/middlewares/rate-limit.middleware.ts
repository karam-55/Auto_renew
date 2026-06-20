import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Implements rate limiting for different endpoints
 */
export class RateLimitMiddleware {
  /**
   * Global rate limiter (100 requests/min per IP)
   */
  static globalLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per window
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests from this IP, please try again later',
        },
      },
      standardHeaders: true, // Return rate limit info in headers
      legacyHeaders: false,
    });
  }

  /**
   * Login endpoint rate limiter (5 requests/min)
   */
  static loginLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 requests per window
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_LOGIN_ATTEMPTS',
          message: 'Too many login attempts, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    });
  }

  /**
   * Refresh token rate limiter (10 requests/min)
   */
  static refreshLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 requests per window
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_REFRESH_ATTEMPTS',
          message: 'Too many refresh token attempts, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Public tracking endpoint rate limiter (30 requests/min)
   */
  static trackingLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per window
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_TRACKING_REQUESTS',
          message: 'Too many tracking requests, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * API endpoint rate limiter (60 requests/min)
   */
  static apiLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per window
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_API_REQUESTS',
          message: 'Too many API requests, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Custom rate limiter with configurable options
   */
  static customLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: options.message || 'Too many requests, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    });
  }

  /**
   * Get client IP address (handles proxy headers)
   */
  static getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}
