/**
 * Reception role (RECEPTIONIST) authorization tests.
 *
 * Mounts the REAL route modules with the REAL `authorize` middleware.
 * Only `authenticate` is stubbed to inject a RECEPTIONIST user, so these
 * tests verify the actual role lists declared in each routes file.
 *
 * Convention:
 *  - Denied endpoints must return 403 (authorize blocks before any DB access).
 *  - Allowed endpoints must NOT return 401/403. They may fail later
 *    (validation/DB) — we only assert the role check passed.
 */
import request from 'supertest';
import express from 'express';

const ROLE = 'RECEPTIONIST';

jest.mock('../../src/shared/middlewares/auth', () => {
  const actual = jest.requireActual('../../src/shared/middlewares/auth');
  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      req.user = { id: 'reception-user', tenantId: 'tenant-1', role: ROLE };
      next();
    },
  };
});

// Prevent audit middleware from touching the DB/audit service
jest.mock('../../src/middleware/audit.middleware', () => ({
  auditContextMiddleware: (_req: any, _res: any, next: any) => next(),
}));

// Prevent tenant guard DB lookups (authorize runs before it anyway)
jest.mock('../../src/middleware/tenant-guard.middleware', () => ({
  tenantGuard: () => (_req: any, _res: any, next: any) => next(),
}));

import workOrdersRouter from '../../src/modules/work-orders/routes';
import bookingsRouter from '../../src/modules/bookings/routes';
import paymentsRouter from '../../src/modules/payments/routes';
import invoicesRouter from '../../src/modules/invoices/routes';
import expensesRouter from '../../src/modules/expenses/routes';
import partsRouter from '../../src/modules/parts/routes';
import partCategoriesRouter from '../../src/modules/part-categories/routes';
import inventoryTransactionsRouter from '../../src/modules/inventory-transactions/routes';
import scheduleRouter from '../../src/modules/schedule/routes';
import dashboardRouter from '../../src/modules/dashboard/routes';
import usersRouter from '../../src/modules/users/routes';

const app = express();
app.use(express.json());
app.use('/api/work-orders', workOrdersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/parts', partsRouter);
app.use('/api/part-categories', partCategoriesRouter);
app.use('/api/inventory-transactions', inventoryTransactionsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users', usersRouter);

const deny = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string) =>
  it(`${method.toUpperCase()} ${path} → 403`, async () => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(403);
  });

const allow = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string) =>
  it(`${method.toUpperCase()} ${path} → not blocked by RBAC`, async () => {
    const res = await request(app)[method](path).send({});
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

describe('RECEPTIONIST — denied', () => {
  // Work orders: view only
  deny('post', '/api/work-orders');
  deny('put', '/api/work-orders/some-id');
  deny('put', '/api/work-orders/some-id/services/svc-1/price');
  deny('post', '/api/work-orders/some-id/materials');
  deny('post', '/api/work-orders/some-id/complete');
  deny('delete', '/api/work-orders/some-id');

  // Bookings: create only, no update/delete/service edits
  deny('put', '/api/bookings/some-id');
  deny('delete', '/api/bookings/some-id');
  deny('post', '/api/bookings/some-id/services');
  deny('delete', '/api/bookings/some-id/services/svc-1');
  deny('post', '/api/bookings/some-id/issue-materials');

  // Invoices: view + collect only, no edit/finalize/cancel/delete
  deny('put', '/api/invoices/some-id');
  deny('post', '/api/invoices/some-id/cancel');
  deny('post', '/api/invoices/some-id/sync-from-booking');
  deny('delete', '/api/invoices/some-id');

  // Payments: collect only
  deny('put', '/api/payments/some-id');
  deny('delete', '/api/payments/some-id');

  // Expenses: register only, no approve/delete/reports
  deny('get', '/api/expenses/summary');
  deny('get', '/api/expenses/trend');
  deny('get', '/api/expenses/report');
  deny('post', '/api/expenses/some-id/approve');
  deny('delete', '/api/expenses/some-id');

  // Inventory/parts administration
  deny('post', '/api/parts');
  deny('put', '/api/parts/some-id');
  deny('patch', '/api/parts/some-id/quantity');
  deny('delete', '/api/parts/some-id');
  deny('post', '/api/part-categories');
  deny('put', '/api/part-categories/some-id');
  deny('post', '/api/inventory-transactions');
  deny('put', '/api/inventory-transactions/some-id');
  deny('delete', '/api/inventory-transactions/some-id');
  deny('post', '/api/inventory-transactions/consume');

  // Schedule management
  deny('post', '/api/schedule');
  deny('put', '/api/schedule/some-id');
  deny('post', '/api/schedule/some-id/start');
  deny('post', '/api/schedule/some-id/complete');
  deny('post', '/api/schedule/some-id/cancel');
  deny('post', '/api/schedule/booking');

  // User administration
  deny('post', '/api/users');
  deny('post', '/api/users/batch');
  deny('put', '/api/users/some-id');
  deny('delete', '/api/users/some-id');
});

describe('RECEPTIONIST — allowed', () => {
  allow('post', '/api/bookings'); // create bookings
  allow('post', '/api/payments'); // collect payments
  allow('post', '/api/invoices'); // POS/front-desk invoices
  allow('post', '/api/invoices/some-id/finalize'); // issue before collection
  allow('post', '/api/invoices/some-id/pay'); // front-desk collection
  allow('post', '/api/expenses'); // register expenses
  allow('get', '/api/expenses');
  allow('get', '/api/invoices');
  allow('get', '/api/payments');
  allow('get', '/api/work-orders'); // view-only
  allow('get', '/api/dashboard/kpis'); // restricted payload (no revenue)
  allow('get', '/api/users'); // staff presence
  allow('get', '/api/schedule');
  allow('get', '/api/bookings');
});
