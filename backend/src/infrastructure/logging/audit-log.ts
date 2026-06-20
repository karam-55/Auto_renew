import { PrismaService } from '../database/prisma.service';
import { Logger } from './logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  isUndo?: boolean;
  undoOfId?: string;
}

export class AuditLog {
  static async log(data: AuditLogData): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entityType,
          entityId: data.entityId || '',
          before: data.changes as any,
          after: null as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          isUndo: data.isUndo || false,
          undoOfId: data.undoOfId,
        },
      });
      Logger.info('Audit log created', { action: data.action, entityType: data.entityType });
    } catch (error) {
      Logger.error('Failed to create audit log', error, data);
    }
  }

  static async logUndo(originalLogId: string, userId?: string): Promise<void> {
    try {
      const prisma = PrismaService.getInstance();
      const originalLog = await prisma.auditLog.findUnique({
        where: { id: originalLogId },
      });

      if (!originalLog) {
        Logger.warn('Original audit log not found for undo', { originalLogId });
        return;
      }

      await prisma.auditLog.create({
        data: {
          userId,
          action: `UNDO: ${originalLog.action}`,
          entity: originalLog.entity,
          entityId: originalLog.entityId,
          before: originalLog.before as any,
          after: originalLog.after as any,
          isUndo: true,
          undoOfId: originalLogId,
        },
      });
      Logger.info('Undo audit log created', { originalLogId });
    } catch (error) {
      Logger.error('Failed to create undo audit log', error, { originalLogId });
    }
  }
}
