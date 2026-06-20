/**
 * E2E API Tests for Accounting Reports
 * Tests HTTP endpoints with mocked auth + real services
 */

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { ReportController } from '../../src/modules/reports/controller';

// Build a minimal Express app with report routes
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock auth middleware — bypass JWT
  app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).user = {
      id: 'test-user-id',
      tenantId: 'test-tenant-id',
      role: 'OWNER',
    };
    next();
  });

  const ctrl = new ReportController();

  // Mount report endpoints
  app.get('/api/reports/balance-sheet', ctrl.getBalanceSheet);
  app.get('/api/reports/profit-loss', ctrl.getProfitLoss);
  app.get('/api/reports/cash-flow', ctrl.getCashFlow);
  app.get('/api/reports/trial-balance', ctrl.getTrialBalance);

  return app;
}

describe('Reports API E2E', () => {
  const app = createTestApp();

  describe('Balance Sheet Endpoint', () => {
    it('GET /api/reports/balance-sheet returns 200 with valid structure', async () => {
      const res = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      // Must have the 3 main sections
      expect(data).toHaveProperty('assets');
      expect(data).toHaveProperty('liabilities');
      expect(data).toHaveProperty('equity');
      expect(data).toHaveProperty('asOfDate');
    });

    it('GET /api/reports/balance-sheet validates invalid dates', async () => {
      const res = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: 'not-a-date', toDate: '2024-12-31' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toContain('Invalid date');
    });
  });

  describe('Profit & Loss Endpoint', () => {
    it('GET /api/reports/profit-loss returns 200 with valid structure', async () => {
      const res = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      // Must have revenue, cogs, expenses sections + totals
      expect(data).toHaveProperty('revenue');
      expect(data).toHaveProperty('cogs');
      expect(data).toHaveProperty('expenses');
      expect(data).toHaveProperty('grossProfit');
      expect(data).toHaveProperty('netProfit');
      expect(data).toHaveProperty('fromDate');
      expect(data).toHaveProperty('toDate');
    });
  });

  describe('Cash Flow Endpoint', () => {
    it('GET /api/reports/cash-flow returns 200 with valid structure', async () => {
      const res = await request(app)
        .get('/api/reports/cash-flow')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      expect(data).toHaveProperty('operatingActivities');
      expect(data).toHaveProperty('investingActivities');
      expect(data).toHaveProperty('financingActivities');
      expect(data).toHaveProperty('netCashFlow');
    });
  });

  describe('Trial Balance Endpoint', () => {
    it('GET /api/reports/trial-balance returns 200 with valid structure', async () => {
      const res = await request(app)
        .get('/api/reports/trial-balance')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');

      const data = res.body.data;
      expect(data).toHaveProperty('accounts');
      expect(data).toHaveProperty('totalDebits');
      expect(data).toHaveProperty('totalCredits');
      expect(data).toHaveProperty('asOfDate');
    });
  });
});
