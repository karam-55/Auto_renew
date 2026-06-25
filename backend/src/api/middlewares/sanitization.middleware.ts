import { Request, Response, NextFunction } from 'express';

/**
 * Input Sanitization Middleware
 * Sanitizes incoming data to prevent XSS and injection attacks
 */
export class SanitizationMiddleware {

  /**
   * Custom sanitization for request body
   */
  static sanitizeBody() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }
      next();
    };
  }

  /**
   * Custom sanitization for request query
   */
  static sanitizeQuery() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }
      next();
    };
  }

  /**
   * Custom sanitization for request params
   */
  static sanitizeParams() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }
      next();
    };
  }

  /**
   * Recursively sanitize an object
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeValue(obj[key]);
      }
    }

    return sanitized;
  }

  /**
   * Sanitize a single value
   */
  private static sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Trim whitespace
      let sanitized = value.trim();
      
      // Remove HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      // Remove script tags and their content
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Escape HTML entities
      sanitized = this.escapeHtml(sanitized);
      
      return sanitized;
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  /**
   * Escape HTML entities
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Validate and sanitize phone number
   */
  static sanitizePhone(phone: string): string {
    if (!phone) return phone;
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string): string {
    if (!url) return url;
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.href;
    } catch {
      return '';
    }
  }
}
