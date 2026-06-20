import prisma from '../config/database';
import { Logger } from '../infrastructure/logging/logger';

export interface AuditLogData {
  userId?: string;
  branchId?: string;
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an action to the audit trail
   */
  static async logAction(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          branchId: data.branchId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          before: data.before,
          after: data.after,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      Logger.error('Failed to log audit action', error);
      // Don't throw - audit logging should not break the main application
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters: {
    userId?: string;
    branchId?: string;
    entity?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      branchId,
      entity,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single audit log by ID
   */
  static async getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Helper to extract IP address from request
   */
  static extractIpAddress(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }

  /**
   * Helper to extract user agent from request
   */
  static extractUserAgent(req: any): string {
    return req.headers['user-agent'] || 'unknown';
  }
}
