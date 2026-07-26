/**
 * Standardized API Response Utility
 * Provides consistent response format across all API endpoints
 */

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: ApiResponseMeta;
  timestamp: string;
  requestId?: string;
}

export class ApiResponseBuilder {
  static success<T>(data: T, meta?: ApiResponseMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number): ApiResponse<T[]> {
    // limit === 0 means "all rows" — avoid division by zero, report a single page.
    const totalPages = limit === 0 ? 1 : Math.ceil(total / limit);
    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static created<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static updated<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static deleted(): ApiResponse<null> {
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  static error(code: string, message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static notFound(resource?: string): ApiResponse {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: resource ? `${resource} not found.` : 'Resource not found.',
      },
      timestamp: new Date().toISOString(),
    };
  }

  static badRequest(message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static unauthorized(message: string = 'Unauthorized access.'): ApiResponse {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static forbidden(message: string = 'Access forbidden.'): ApiResponse {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static conflict(message: string): ApiResponse {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static tooManyRequests(message: string = 'Rate limit exceeded. Please try again later.'): ApiResponse {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Express response helper functions
 */
import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponseMeta): void {
  res.status(statusCode).json(ApiResponseBuilder.success(data, meta));
}

export function sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number): void {
  res.status(200).json(ApiResponseBuilder.paginated(data, total, page, limit));
}

export function sendCreated<T>(res: Response, data: T): void {
  res.status(201).json(ApiResponseBuilder.created(data));
}

export function sendUpdated<T>(res: Response, data: T): void {
  res.status(200).json(ApiResponseBuilder.updated(data));
}

export function sendDeleted(res: Response): void {
  res.status(204).json(ApiResponseBuilder.deleted());
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): void {
  res.status(statusCode).json(ApiResponseBuilder.error(code, message, details));
}

export function sendNotFound(res: Response, resource?: string): void {
  res.status(404).json(ApiResponseBuilder.notFound(resource));
}

export function sendBadRequest(res: Response, message: string, details?: any): void {
  res.status(400).json(ApiResponseBuilder.badRequest(message, details));
}

export function sendUnauthorized(res: Response, message?: string): void {
  res.status(401).json(ApiResponseBuilder.unauthorized(message));
}

export function sendForbidden(res: Response, message?: string): void {
  res.status(403).json(ApiResponseBuilder.forbidden(message));
}

export function sendConflict(res: Response, message: string): void {
  res.status(409).json(ApiResponseBuilder.conflict(message));
}
