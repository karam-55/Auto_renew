import { PrismaClient } from '@prisma/client';

const EXCLUDED_FROM_SOFT_DELETE = new Set([
  'AuditLog', 'VehicleHistory', 'JournalLine', 'InvoiceItem', 'BookingService',
  'ServicePart', 'EmployeeBranch', 'CouponUsage', 'TaskAssignment',
  'InventoryTransferItem', 'InventoryCountItem', 'GoodsReceiptNoteLine',
  'MaintenancePackageItem', 'PurchaseOrderItem', 'Attachment', 'ExchangeRate',
  'VehicleMileageLog', 'VehicleInspectionChecklist', 'VehicleIssue',
  'PreventiveMaintenanceLog', 'AppointmentLog', 'BookingExtraCharge',
  'ElectronicSignature', 'PushNotificationToken', 'CashRegisterSession',
  'PromotionCondition', 'LoyaltyPoint', 'Attendance', 'PayrollRecord',
  'Shift', 'MechanicShift', 'TaxRate', 'Notification', 'WhatsAppMessage',
]);

function addDeletedAtNullFilter(where: any): any {
  if (!where) return { deletedAt: null };
  if (typeof where !== 'object') return where;
  if (where.OR || where.AND || where.NOT) {
    return { ...where, deletedAt: null };
  }
  return { ...where, deletedAt: null };
}

export class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

      PrismaService.instance.$use(async (params, next) => {
        const model = params.model;
        if (!model || EXCLUDED_FROM_SOFT_DELETE.has(model)) {
          return next(params);
        }

        if (['findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = addDeletedAtNullFilter(params.args.where);
        }

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
    }
    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }

  static async transaction<T>(
    callback: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    const prisma = PrismaService.getInstance();
    return await prisma.$transaction(callback);
  }
}
