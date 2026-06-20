import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { AuditService } from '../../services/audit.service';
import { requirePermission } from '../../middleware/permission.middleware';

export class AuditController {
  /**
   * Get audit logs with filtering and pagination
   * GET /api/audit
   */
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const {
        userId,
        branchId,
        entity,
        action,
        dateFrom,
        dateTo,
        page = '1',
        limit = '50',
      } = req.query;

      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      if (userId) filters.userId = userId as string;
      if (branchId) filters.branchId = branchId as string;
      if (entity) filters.entity = entity as string;
      if (action) filters.action = action as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await AuditService.getAuditLogs(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      Logger.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs',
      });
    }
  }

  /**
   * Get a single audit log by ID
   * GET /api/audit/:id
   */
  static async getAuditLogById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const auditLog = await AuditService.getAuditLogById(id);

      if (!auditLog) {
        return res.status(404).json({
          success: false,
          error: 'Audit log not found',
        });
      }

      res.json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      Logger.error('Error fetching audit log:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit log',
      });
    }
  }
}
