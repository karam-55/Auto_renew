import { PrismaClient } from '@prisma/client';
import { Logger } from '../infrastructure/logging/logger';
import { attachQueryOptimizer } from '../shared/utils/query-optimizer';

/**
 * Connection pooling is configured via DATABASE_URL in .env:
 * Example: postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
 * 
 * Or via environment variables:
 * DATABASE_CONNECTION_LIMIT=20
 * DATABASE_POOL_TIMEOUT=30
 */

// Connection pool settings for high concurrency
const connectionLimit = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '50', 10);
const poolTimeout = parseInt(process.env.DATABASE_POOL_TIMEOUT || '30', 10);

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Attach query performance monitoring
attachQueryOptimizer(prisma);

// Connection health check
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    Logger.error('Database connection check failed', error);
    return false;
  }
}

// Periodic health check every 60 seconds
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    const healthy = await checkDatabaseConnection();
    if (!healthy) {
      Logger.error('Database health check failed - connection may be lost');
    }
  }, 60000);
}

// Models that should NOT have soft-delete filtering (logs, junction tables, child records)
const EXCLUDED_FROM_SOFT_DELETE = new Set([
  'AuditLog',
  'VehicleHistory',
  'JournalLine',
  'InvoiceItem',
  'BookingService',
  'ServicePart',
  'EmployeeBranch',
  'CouponUsage',
  'TaskAssignment',
  'InventoryTransferItem',
  'InventoryCountItem',
  'GoodsReceiptNoteLine',
  'MaintenancePackageItem',
  'PurchaseOrderItem',
  'Attachment',
  'ExchangeRate',
  'VehicleMileageLog',
  'VehicleInspectionChecklist',
  'VehicleIssue',
  'PreventiveMaintenanceLog',
  'AppointmentLog',
  'BookingExtraCharge',
  'ElectronicSignature',
  'PushNotificationToken',
  'CashRegisterSession',
  'PromotionCondition',
  'LoyaltyPoint',
  'Attendance',
  'PayrollRecord',
  'Shift',
  'MechanicShift',
  'TaxRate',
  'Notification',
  'WhatsAppMessage',
  'AssetCategory',
  'CostCenter',
]);

function shouldApplySoftDelete(model: string): boolean {
  return !EXCLUDED_FROM_SOFT_DELETE.has(model);
}

function addDeletedAtNullFilter(where: any): any {
  if (!where) return { deletedAt: null };
  if (typeof where !== 'object') return where;
  if (where.OR || where.AND || where.NOT) {
    return { ...where, deletedAt: null };
  }
  return { ...where, deletedAt: null };
}

prisma.$use(async (params, next) => {
  const model = params.model;
  if (!model || !shouldApplySoftDelete(model)) {
    return next(params);
  }

  // 1. Auto-filter soft-deleted records on read operations
  if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
    params.args = params.args || {};
    if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
      // For findUnique, we need to convert to findFirst to support AND with deletedAt filter
      // This is because findUnique only supports exact match on unique fields
      const originalWhere = params.args.where;
      if (originalWhere && typeof originalWhere === 'object') {
        params.action = params.action === 'findUniqueOrThrow' ? 'findFirstOrThrow' : 'findFirst';
        params.args.where = { ...originalWhere, deletedAt: null };
      }
    } else {
      params.args.where = addDeletedAtNullFilter(params.args.where);
    }
  }

  // 2. Convert hard delete to soft delete
  if (params.action === 'delete') {
    params.action = 'update';
    params.args = params.args || {};
    params.args.data = { deletedAt: new Date() };
  }

  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args = params.args || {};
    params.args.data = { deletedAt: new Date() };
  }

  return next(params);
});

export default prisma;
