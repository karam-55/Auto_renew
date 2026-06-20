import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { DatabaseError } from '../../infrastructure/errors/database-error';
import { BusinessRuleError } from '../../infrastructure/errors/business-rule-error';
import { NotFoundError } from '../../infrastructure/errors/not-found-error';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export class ErrorMiddleware {
  static handle(error: any, req: Request, res: Response, next: NextFunction): void {
    const requestId = (req as any).requestId || 'unknown';
    const isDevelopment = process.env.NODE_ENV === 'development';

    Logger.error(`[${requestId}] Error`, error);

    // Validation errors
    if (error.name === 'ValidationError' || error.name === 'PrismaClientValidationError') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Invalid input data',
          details: isDevelopment ? error.details : undefined,
          requestId,
        },
      });
      return;
    }

    // Authentication errors
    if (error.name === 'UnauthorizedError' || error.message?.includes('Unauthorized')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId,
        },
      });
      return;
    }

    // Authorization errors
    if (error.name === 'ForbiddenError' || error.message?.includes('Permission denied')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          requestId,
        },
      });
      return;
    }

    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          requestId,
        },
      });
      return;
    }

    if (error instanceof BusinessRuleError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: error.message,
          requestId,
        },
      });
      return;
    }

    if (error instanceof DatabaseError) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details: isDevelopment ? error.message : undefined,
          requestId,
        },
      });
      return;
    }

    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists',
          details: isDevelopment ? error.meta : undefined,
          requestId,
        },
      });
      return;
    }

    // Prisma record not found
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
          requestId,
        },
      });
      return;
    }

    // Generic error with stack trace in development
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: isDevelopment ? { stack: error.stack } : undefined,
        requestId,
      },
    });
  }

  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      error: null,
    });
  }

  static error(res: Response, code: string, message: string, statusCode: number = 400, details?: any): void {
    const requestId = (res.req as any)?.requestId || 'unknown';
    res.status(statusCode).json({
      success: false,
      error: { code, message, details, requestId },
    });
  }
}
