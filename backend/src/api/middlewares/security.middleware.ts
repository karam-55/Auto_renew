import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Security Headers Middleware
 * Adds security headers: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, CSP
 */
export class SecurityMiddleware {
  /**
   * Apply helmet with custom configuration
   */
  static applyHelmet() {
    return helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // HSTS (HTTP Strict Transport Security)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options (prevent clickjacking)
      frameguard: {
        action: 'deny',
      },
      // X-Content-Type-Options (prevent MIME sniffing)
      noSniff: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // X-XSS Protection (legacy, but still useful)
      xssFilter: true,
      // Disable X-Powered-By header
      hidePoweredBy: true,
    });
  }

  /**
   * Custom CORS configuration
   * Allow only specific origins
   */
  static configureCors() {
    const corsOrigin = process.env.CORS_ORIGIN || '';
    const allowedOrigins = corsOrigin === '*'
      ? ['*']
      : [
          ...(corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : []),
          process.env.ADMIN_PANEL_URL || 'http://localhost:3000',
          process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3001',
          process.env.PRODUCTION_DOMAIN || 'https://yourdomain.com',
        ];

    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      if (corsOrigin === '*') {
        res.header('Access-Control-Allow-Origin', '*');
      } else if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-id, x-branch-id');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours

      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }

      next();
    };
  }

  /**
   * Additional security headers
   */
  static additionalHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // X-Frame-Options: DENY
      res.setHeader('X-Frame-Options', 'DENY');
      
      // X-Content-Type-Options: nosniff
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // X-XSS-Protection: 1; mode=block
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer-Policy: strict-origin-when-cross-origin
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions-Policy (formerly Feature-Policy)
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Remove X-Powered-By
      res.removeHeader('X-Powered-By');

      next();
    };
  }
}
