import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ErrorMiddleware } from './error.middleware';

export class ValidationMiddleware {
  /**
   * Validate request body against Joi schema
   */
  static validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // Return all errors
        stripUnknown: true, // Remove unknown fields
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        ErrorMiddleware.error(
          res,
          'VALIDATION_ERROR',
          'Validation failed',
          400
        );
        return;
      }

      // Replace request body with sanitized value
      req.body = value;
      next();
    };
  }

  /**
   * Validate request query against Joi schema
   */
  static validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        ErrorMiddleware.error(
          res,
          'VALIDATION_ERROR',
          'Query validation failed',
          400
        );
        return;
      }

      req.query = value;
      next();
    };
  }

  /**
   * Validate request params against Joi schema
   */
  static validateParams(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        ErrorMiddleware.error(
          res,
          'VALIDATION_ERROR',
          'Parameter validation failed',
          400
        );
        return;
      }

      req.params = value;
      next();
    };
  }

  /**
   * Common validation schemas
   */
  static schemas = {
    // UUID validation
    uuid: Joi.string().uuid().required(),
    
    // Pagination
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),

    // Date range
    dateRange: Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
    }),


    // Phone
    phone: Joi.string().pattern(/^[0-9+]{10,15}$/).required(),

    // Status
    status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),

    // Auth: Register
    register: Joi.object({
      tenantId: Joi.string().uuid().optional(),
      fullName: Joi.string().min(2).max(100).required(),
      username: Joi.string().min(3).max(50).alphanum().required(),
      password: Joi.string().min(8).max(100).required(),
      phone: Joi.string().pattern(/^[0-9+]{10,15}$/).required(),
      role: Joi.string().valid('OWNER', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'MECHANIC', 'HR_MANAGER', 'ACCOUNTANT', 'SALES', 'CASHIER').optional(),
    }),

    // Auth: Login
    login: Joi.object({
      username: Joi.string().min(3).max(50).required(),
      password: Joi.string().min(1).required(),
      tenantId: Joi.string().min(1).max(100).optional(),
    }),

    // Auth: Refresh Token
    refreshToken: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  };
}
