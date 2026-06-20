import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import { Logger } from '../infrastructure/logging/logger';

/**
 * Security Middleware Collection
 * Provides rate limiting, CSRF protection, and security headers
 */

// Rate limiting configurations
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    Logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    });
  },
});

// Stricter rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    Logger.warn('Auth rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
      },
    });
  },
});

// CSRF Token middleware
const csrfTokens = new Map<string, { token: string; expires: number }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, { token, expires: Date.now() + CSRF_TOKEN_EXPIRY });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// CSRF Protection Middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints with Bearer token (stateless JWT)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Skip for webhook endpoints
  if (req.path.startsWith('/webhooks/')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionId = req.headers['x-session-id'] as string;

  if (!csrfToken || !sessionId || !validateCsrfToken(sessionId, csrfToken as string)) {
    Logger.warn('CSRF validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_INVALID',
        message: 'Invalid or missing CSRF token.',
      },
    });
    return;
  }

  next();
}

// Request ID middleware for tracing
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const randomSuffix = randomBytes(4).toString('hex');
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${randomSuffix}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

// Clean up expired CSRF tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now > data.expires) {
      csrfTokens.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes
