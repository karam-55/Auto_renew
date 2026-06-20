import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { Logger } from '../infrastructure/logging/logger';

// Prisma model names that have tenantId field and can be checked
const TENANT_CHECKABLE_MODELS = new Set([
  'Booking', 'Customer', 'Vehicle', 'Invoice', 'Payment', 'Part', 'Service',
  'Employee', 'Branch', 'Warehouse', 'Supplier', 'Account', 'JournalEntry',
  'PurchaseOrder', 'GoodsReceiptNote', 'InventoryCount', 'InventoryTransfer',
  'MaintenancePackage', 'Cheque', 'InstallmentPlan', 'FiscalPeriod',
  'Currency', 'ExchangeRate', 'User', 'Role', 'Notification', 'Expense',
  'Department', 'Shift', 'Attendance', 'PayrollRecord', 'MechanicAssignment',
  'LoyaltyPointTransaction', 'CustomerMembership', 'MembershipPlan',
  'VehicleCategory', 'ServiceCategory', 'PartCategory', 'VehicleModel',
  'VehicleBrand', 'Promotion', 'Coupon', 'TaxRate', 'CompanySettings',
  'PriceList', 'PriceListItem', 'Subscription', 'NotificationTemplate',
  'WhatsAppTemplate', 'ReportTemplate', 'DashboardWidget', 'AuditLog',
  'ActivityLog', 'ChatConversation', 'ChatMessage', 'ChatParticipant',
]);

// Tenant ID field cache per model
const hasTenantIdCache = new Map<string, boolean>();

function modelHasTenantId(model: string): boolean {
  if (hasTenantIdCache.has(model)) {
    return hasTenantIdCache.get(model)!;
  }
  const result = TENANT_CHECKABLE_MODELS.has(model);
  hasTenantIdCache.set(model, result);
  return result;
}

/**
 * Express middleware to verify a resource belongs to the requesting tenant.
 * This prevents BOLA (Broken Object Level Authorization) attacks.
 *
 * Usage:
 *   router.get('/:id', authenticate, tenantGuard('Booking'), getBookingById);
 *   router.put('/:id', authenticate, tenantGuard('Invoice'), updateInvoice);
 */
export function tenantGuard(modelName: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    if (!user || !user.tenantId) {
      Logger.warn('TenantGuard: No tenantId in request', { path: req.path });
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant information required.' },
      });
      return;
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      // No :id param, skip check (e.g. list endpoints filter by tenantId elsewhere)
      return next();
    }

    // Skip check if model is not tenant-checkable (junction tables, system tables)
    if (!modelHasTenantId(modelName)) {
      return next();
    }

    try {
      // Dynamically query the model using shared Prisma instance
      const model = (prisma as any)[modelName];
      if (!model) {
        Logger.error(`TenantGuard: Unknown model ${modelName}`);
        return next();
      }

      // Use findFirst with both id and tenantId to check ownership
      const record = await model.findFirst({
        where: {
          id: resourceId,
          tenantId: user.tenantId,
        },
        select: { id: true },
      });

      if (!record) {
        // Could be the record doesn't exist OR belongs to another tenant
        // Return 404 to avoid information leakage
        Logger.warn('TenantGuard: Resource not found or not owned by tenant', {
          model: modelName,
          resourceId,
          tenantId: user.tenantId,
          userId: user.id,
        });
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Resource not found.' },
        });
        return;
      }

      // Store resource info on request for downstream use
      (req as any).resource = { id: resourceId, model: modelName };
      next();
    } catch (error) {
      Logger.error('TenantGuard error', error, {
        model: modelName,
        resourceId,
        tenantId: user.tenantId,
      });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization check failed.' },
      });
    }
  };
}

/**
 * Batch tenant guard - checks ownership for nested resources.
 * Example: /api/customers/:customerId/vehicles/:id
 */
export function tenantGuardNested(parentModel: string, childModel: string, parentField: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    if (!user || !user.tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant information required.' },
      });
      return;
    }

    const parentId = req.params[`${parentModel.toLowerCase()}Id`];
    const childId = req.params.id;

    try {
      const parent = await (prisma as any)[parentModel].findFirst({
        where: { id: parentId, tenantId: user.tenantId },
        select: { id: true },
      });

      if (!parent) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Parent resource not found.' },
        });
        return;
      }

      if (childId) {
        const child = await (prisma as any)[childModel].findFirst({
          where: { id: childId, [parentField]: parentId, tenantId: user.tenantId },
          select: { id: true },
        });

        if (!child) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Resource not found.' },
          });
          return;
        }
      }

      next();
    } catch (error) {
      Logger.error('TenantGuardNested error', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization check failed.' },
      });
    }
  };
}
