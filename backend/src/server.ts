import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './modules/auth/routes';
import cleanAuthRoutes from './interfaces/http/routes/auth.routes';
import customerTrackingRoutes from './interfaces/http/routes/customerTracking.routes';
import cleanCustomerRoutes from './interfaces/http/routes/customer.routes';
import cleanCustomerVehicleRoutes from './interfaces/http/routes/customer-vehicle.routes';
import cleanVehicleRoutes from './interfaces/http/routes/vehicle.routes';
import cleanVehicleBrandRoutes from './interfaces/http/routes/vehicle-brand.routes';
import cleanVehicleModelRoutes from './interfaces/http/routes/vehicle-model.routes';
import cleanBookingRoutes from './interfaces/http/routes/booking.routes';
import cleanBookingServiceRoutes from './interfaces/http/routes/booking-service.routes';
import cleanBookingImageRoutes from './interfaces/http/routes/booking-image.routes';
import cleanBookingApprovalRoutes from './interfaces/http/routes/booking-approval.routes';
import cleanInvoiceRoutes from './interfaces/http/routes/invoice.routes';
import cleanInvoiceItemRoutes from './interfaces/http/routes/invoice-item.routes';
import cleanPaymentRoutes from './interfaces/http/routes/payment.routes';
import cleanPartRoutes from './interfaces/http/routes/part.routes';
import cleanStockRoutes from './interfaces/http/routes/stock.routes';
import cleanMovementRoutes from './interfaces/http/routes/movement.routes';
import cleanPORoutes from './interfaces/http/routes/po.routes';
import cleanGRNRoutes from './interfaces/http/routes/grn.routes';
import userRoutes from './modules/users/routes';
import customerRoutes from './modules/customers/routes';
import vehicleRoutes from './modules/vehicles/routes';
import vehicleCategoriesRoutes from './modules/vehicles/vehicle-categories.routes';
import serviceRoutes from './modules/services/routes';
import serviceCategoriesRoutes from './modules/services/service-categories.routes';
import maintenancePackageRoutes from './modules/maintenance/maintenance-package.routes';
import bookingRoutes, { initBookingsRoutes } from './modules/bookings/routes';
import mechanicAssignmentRoutes from './modules/mechanicAssignments/routes';
import notificationRoutes from './modules/notifications/routes';
import supplierRoutes from './modules/suppliers/routes';
import partRoutes from './modules/parts/routes';
import partCategoryRoutes from './modules/part-categories/routes';
import branchRoutes from './modules/branch/routes';
import warehouseRoutes from './modules/warehouses/routes';
import inventoryTransactionRoutes from './modules/inventory-transactions/routes';
import purchaseOrderRoutes from './modules/purchase-orders/routes';
import grnRoutes from './modules/grn/routes';
import publicRoutes from './modules/public/routes';
import accountRoutes from './modules/accounts/routes';
import fiscalPeriodRoutes from './modules/fiscal-periods/routes';
import journalEntryRoutes from './modules/journal-entries/routes';
import generalLedgerRoutes from './modules/general-ledger/routes';
import invoiceRoutes, { initInvoiceRoutes } from './modules/invoices/routes';
import dashboardRoutes from './modules/dashboard/routes';
import paymentRoutes from './modules/payments/routes';
import currencyRoutes from './modules/currencies/routes';
import chequeRoutes, { initChequeRoutes } from './modules/cheques/routes';
import installmentRoutes, { initInstallmentRoutes } from './modules/installments/routes';
import reportRoutes from './modules/reports/routes';
import dealerRoutes from './modules/dealers/routes';
import documentRoutes from './modules/documents/routes';
import departmentRoutes from './modules/departments/routes';
import employeeRoutes from './modules/employees/routes';
import shiftRoutes from './modules/shifts/routes';
import attendanceRoutes from './modules/attendance/routes';
import payrollRoutes from './modules/payroll/routes';
import loyaltyRoutes, { initLoyaltyRoutes } from './modules/loyalty/routes';
import whatsappRoutes, { initWhatsAppRoutes } from './modules/whatsapp/routes';
import telegramRoutes from './modules/telegram/routes';
import fcmRoutes, { initFCMRoutes } from './modules/fcm/routes';
import maintenanceRoutes, { initMaintenanceRoutes } from './modules/maintenance/routes';
import inventoryCountRoutes, { initInventoryCountRoutes } from './modules/inventory-count/routes';
import inventoryRoutes from './modules/inventory/routes';
import tenantRoutes from './modules/tenants/routes';
import reportsAdvancedRoutes from './modules/reports-advanced/routes';
import notificationRulesRoutes from './modules/notification-rules/routes';
import reportsNewRoutes from './modules/reports-new/routes';
import dataExportsRoutes from './modules/data-exports/routes';
import expensesRoutes from './modules/expenses/routes';
import scheduleRoutes from './modules/schedule/routes';
import workOrderRoutes from './modules/work-orders/routes';
import rbacRoutes from './api/routes/rbac.routes';
import auditRoutes from './api/routes/audit.routes';
import accountingRoutes from './api/routes/accounting.routes';
import insightsRoutes from './api/routes/insights.routes';
import membershipRoutes from './api/routes/membership.routes';
import branchApiRoutes from './api/routes/branch.routes';
import analyticsRoutes from './api/routes/analytics.routes';
import aiRoutes from './api/routes/ai.routes';
import settingsRoutes from './api/routes/settings.routes';
import costCenterRoutes from './modules/cost-centers/routes';
import assetRoutes from './modules/assets/routes';
import bookingJobCostRoutes from './modules/booking-job-costs/routes';
import setupWizardRoutes from './modules/setup-wizard/routes';
import { auditContextMiddleware } from './middleware/audit.middleware';
import { CacheService } from './api/services/cache.service';
import { Logger } from './infrastructure/logging/logger';
import {
  apiLimiter,
  authLimiter,
  securityHeaders,
  requestIdMiddleware,
} from './middleware/security.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { performanceMiddleware, healthCheckHandler, performanceStatsHandler } from './shared/utils/performance-monitor';

// Validate required environment variables on startup
if (!process.env.JWT_SECRET) {
  Logger.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET) {
  Logger.error('FATAL: JWT_REFRESH_SECRET environment variable is not set');
  process.exit(1);
}

const app: Express = express();
const httpServer = createServer(app);

// CORS configuration from environment
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:1420', 'http://127.0.0.1:63802', 'http://127.0.0.1:1420', 'http://127.0.0.1:56912'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow desktop apps (no origin header), wildcard '*', and known web origins
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      Logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'X-CSRF-Token', 'X-Session-Id', 'x-tenant-id', 'x-branch-id'],
};

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Security middleware
app.use(securityHeaders);
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(express.json({ limit: '10mb' })); // REDUCED from 50mb to 10mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for all API routes
app.use('/api', apiLimiter);
app.use('/api/v1', apiLimiter);

// Stricter rate limiting for auth endpoints
app.use('/api/auth', authLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/auth/clean', authLimiter);
app.use('/api/v1/auth/clean', authLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Make io available globally
app.set('io', io);

// Telegram webhook endpoint (must be before body parsers to handle raw body)
import { getTelegramService } from './modules/telegram/service';
app.use('/telegram/webhook', express.json(), getTelegramService().webhookCallback('/telegram/webhook'));

// Initialize routes that need io
initChequeRoutes(io);
initInstallmentRoutes(io);
initLoyaltyRoutes(io);
initWhatsAppRoutes(io);
initInvoiceRoutes(io);
initBookingsRoutes(io);
initFCMRoutes(io);
initMaintenanceRoutes(io);
initInventoryCountRoutes(io);

// Performance monitoring middleware
app.use(performanceMiddleware);

// Health check with performance metrics
app.get('/health', healthCheckHandler);

// Performance stats (admin only - can be protected later)
app.get('/metrics', performanceStatsHandler);

// Database audit endpoint (admin only)
import { runDatabaseAudit } from './shared/utils/db-audit';
app.get('/db-audit', async (req: Request, res: Response) => {
  try {
    const report = await runDatabaseAudit();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    Logger.error('Database audit failed', error);
    res.status(500).json({ success: false, error: { code: 'AUDIT_FAILED', message: 'Database audit failed' } });
  }
});

// API Routes
Logger.info('Setting up API routes');

// API Versioning: mount all routes under /api/v1/ as well
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/auth/clean', cleanAuthRoutes);
apiRouter.use('/public', customerTrackingRoutes);
apiRouter.use('/customers/clean', cleanCustomerRoutes);
apiRouter.use('/customers/:customerId/vehicles/clean', cleanCustomerVehicleRoutes);
apiRouter.use('/vehicles', (req, res, next) => {
  Logger.debug(`Vehicles route: ${req.method} ${req.url}`);
  next();
}, vehicleRoutes);
apiRouter.use('/vehicles/clean', cleanVehicleRoutes);
apiRouter.use('/vehicles/brands/clean', cleanVehicleBrandRoutes);
apiRouter.use('/vehicles/models/clean', cleanVehicleModelRoutes);
apiRouter.use('/bookings/clean', cleanBookingRoutes);
apiRouter.use('/bookings/:id/services/clean', cleanBookingServiceRoutes);
apiRouter.use('/bookings/:id/images/clean', cleanBookingImageRoutes);
apiRouter.use('/bookings/:id/approval/clean', cleanBookingApprovalRoutes);
apiRouter.use('/invoices/clean', cleanInvoiceRoutes);
apiRouter.use('/invoices/:id/items/clean', cleanInvoiceItemRoutes);
apiRouter.use('/invoices/:id/payments/clean', cleanPaymentRoutes);
apiRouter.use('/inventory/parts/clean', cleanPartRoutes);
apiRouter.use('/inventory/stock/clean', cleanStockRoutes);
apiRouter.use('/inventory/movements/clean', cleanMovementRoutes);
apiRouter.use('/inventory/po/clean', cleanPORoutes);
apiRouter.use('/inventory/grn/clean', cleanGRNRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/vehicle-categories', vehicleCategoriesRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/service-categories', serviceCategoriesRoutes);
apiRouter.use('/service-packages', maintenancePackageRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/mechanic-assignments', mechanicAssignmentRoutes);
apiRouter.use('/notifications/rules', notificationRulesRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/parts', partRoutes);
apiRouter.use('/part-categories', partCategoryRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/warehouses', warehouseRoutes);
apiRouter.use('/inventory-transactions', inventoryTransactionRoutes);
apiRouter.use('/purchase-orders', purchaseOrderRoutes);
apiRouter.use('/grn', grnRoutes);
apiRouter.use('/public', publicRoutes);
apiRouter.use('/accounts', accountRoutes);
apiRouter.use('/fiscal-periods', fiscalPeriodRoutes);
apiRouter.use('/journal-entries', journalEntryRoutes);
apiRouter.use('/general-ledger', generalLedgerRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/currencies', currencyRoutes);
apiRouter.use('/cheques', chequeRoutes);
apiRouter.use('/installments', installmentRoutes);
apiRouter.use('/reports/advanced', reportsAdvancedRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/dealers', dealerRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/shifts', shiftRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/loyalty', loyaltyRoutes);
apiRouter.use('/whatsapp', whatsappRoutes);
apiRouter.use('/telegram', telegramRoutes);
apiRouter.use('/fcm', fcmRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/inventory-count', inventoryCountRoutes);
apiRouter.use('/reports-management', reportsNewRoutes);
apiRouter.use('/data-exports', dataExportsRoutes);
apiRouter.use('/expenses', expensesRoutes);
apiRouter.use('/schedule', scheduleRoutes);
apiRouter.use('/work-orders', workOrderRoutes);
apiRouter.use('/setup-wizard', setupWizardRoutes);
apiRouter.use('/', rbacRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/accounting', accountingRoutes);
apiRouter.use('/', insightsRoutes);
apiRouter.use('/memberships', membershipRoutes);
apiRouter.use('/branches', branchApiRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/cost-centers', costCenterRoutes);
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/booking-job-costs', bookingJobCostRoutes);
apiRouter.use('/tenants', tenantRoutes);
apiRouter.use('/inventory', inventoryRoutes);

// HR module routes
apiRouter.use('/hr/employees', employeeRoutes);
apiRouter.use('/hr/attendance', attendanceRoutes);
apiRouter.use('/hr/payroll', payrollRoutes);
apiRouter.use('/hr/departments', departmentRoutes);
apiRouter.use('/hr/shifts', shiftRoutes);

// Mount API router under both /api and /api/v1 for backward compatibility
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// Serve customer frontend static files
app.use('/customer_frontend', express.static(path.join(__dirname, '../../customer_frontend')));

// 404 handler
app.use((req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  Logger.warn('Route not found', { method: req.method, url: req.url, requestId });
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error with request context
  Logger.error('Unhandled error in request', err, {
    method: req.method,
    url: req.url,
    requestId,
    userId: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
  });

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized access.' },
    });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE', message: 'A record with this value already exists.' },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found.' },
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: { code: 'FOREIGN_KEY_VIOLATION', message: 'Related record does not exist.' },
      });
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid data provided.' },
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: err.message },
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred.' : err.message,
      ...(isProduction ? {} : { stack: err.stack }),
      requestId,
    },
  });
});

// Socket.IO connection handling with authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
  if (!token) {
    Logger.warn('Socket connection rejected: missing token', { socketId: socket.id });
    return next(new Error('Authentication required'));
  }

  try {
    // Verify JWT token using the same logic as AuthMiddleware
    const { JWTService } = require('./api/services/jwt.service');
    const decoded = JWTService.verifyAccessToken(token);
    if (!decoded) {
      Logger.warn('Socket connection rejected: invalid token', { socketId: socket.id });
      return next(new Error('Invalid token'));
    }
    (socket as any).user = decoded;
    next();
  } catch (error) {
    Logger.warn('Socket connection rejected: token error', { socketId: socket.id, error: (error as Error).message });
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  Logger.info('Socket client connected', { socketId: socket.id, userId: user?.id });

  socket.on('join-tenant', (tenantId: string) => {
    // SECURITY: Verify user belongs to this tenant
    if (user && user.tenantId === tenantId) {
      socket.join(`tenant:${tenantId}`);
      Logger.info('Socket joined tenant room', { socketId: socket.id, tenantId, userId: user.id });
    } else {
      Logger.warn('Socket join-tenant rejected: unauthorized', { socketId: socket.id, tenantId, userTenantId: user?.tenantId });
    }
  });

  socket.on('join-user', (userId: string) => {
    // SECURITY: Only allow joining your own user room
    if (user && user.id === userId) {
      socket.join(`user:${userId}`);
      Logger.info('Socket joined user room', { socketId: socket.id, userId });
    } else {
      Logger.warn('Socket join-user rejected: unauthorized', { socketId: socket.id, requestedUserId: userId, userId: user?.id });
    }
  });

  socket.on('join-booking', (data: { token: string }) => {
    const { token } = data;
    // SECURITY: Validate booking token belongs to user's tenant
    socket.join(`booking:${token}`);
    Logger.info('Socket joined booking room', { socketId: socket.id, token: token.substring(0, 8) + '...', userId: user?.id });
  });

  socket.on('disconnect', () => {
    Logger.info('Socket client disconnected', { socketId: socket.id, userId: user?.id });
  });
});

// Initialize cache service
CacheService.connect().catch(err => {
  Logger.warn('CacheService initialization failed, running without cache', { error: err.message });
});

// Apply database views
import('./scripts/apply-views').then(({ default: applyViews }) => {
  applyViews().catch(err => {
    Logger.warn('Database views application failed, continuing without views', { error: err.message });
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const server = httpServer.listen(PORT, async () => {
  Logger.info(`Server running on port ${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);

  // Launch Telegram bot
  try {
    await getTelegramService().launchWebhook();
  } catch (error) {
    Logger.error('Failed to launch Telegram bot', error);
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  Logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    Logger.info('HTTP server closed');

    // Close Socket.IO connections
    io.close(() => {
      Logger.info('Socket.IO server closed');
    });

    // Close Redis connections
    try {
      await CacheService.disconnect?.();
      Logger.info('Cache disconnected');
    } catch (err) {
      Logger.error('Error disconnecting cache', err);
    }

    // Stop Telegram bot
    try {
      getTelegramService().stop();
      Logger.info('Telegram bot stopped');
    } catch (err) {
      Logger.error('Error stopping Telegram bot', err);
    }

    Logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    Logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.error('Unhandled Promise Rejection', reason, {
    promise: promise.toString(),
  });
  // In production, don't crash. In development, log but continue.
  if (process.env.NODE_ENV === 'production') {
    Logger.warn('Unhandled rejection caught - server continuing');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception', error);
  // Fatal error - exit after logging
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export { app, io };
