import request from 'supertest';
import express from 'express';
import { ReportController } from '../../src/modules/reports/controller';

describe('Reports API RBAC Tests', () => {
  let app: express.Application;
  let reportController: ReportController;

  const createAppWithAuth = (userRole: string) => {
    const app = express();
    app.use(express.json());

    // Mock authenticate middleware
    app.use((req: any, res: any, next: any) => {
      req.user = {
        id: 'user-123',
        tenantId: 'tenant-123',
        role: userRole,
      };
      next();
    });

    // Mock authorize middleware
    app.use((req: any, res: any, next: any) => {
      const allowedRoles = ['OWNER', 'MANAGER', 'ACCOUNTANT'];
      if (allowedRoles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }
    });

    reportController = new ReportController();

    // Mock the report service methods
    reportController['reportService'] = {
      generateBalanceSheet: jest.fn().mockResolvedValue({
        assets: { total: 1000000 },
        liabilities: { total: 400000 },
        equity: { total: 600000 },
      }),
      generateProfitLoss: jest.fn().mockResolvedValue({
        revenue: { total: 500000 },
        netProfit: 100000,
      }),
      generateCashFlow: jest.fn().mockResolvedValue({
        netCashFlow: 50000,
        endingCash: 150000,
      }),
      generateTrialBalance: jest.fn().mockResolvedValue({
        accounts: [],
        totalDebit: 0,
        totalCredit: 0,
        isBalanced: true,
      }),
      generateAgedReceivables: jest.fn().mockResolvedValue({
        customers: [],
        summary: { totalOutstanding: 0 },
      }),
      generateAgedPayables: jest.fn().mockResolvedValue({
        suppliers: [],
        summary: { totalOutstanding: 0 },
      }),
    } as any;

    const router = express.Router();
    router.get('/balance-sheet', reportController.getBalanceSheet);
    router.get('/profit-loss', reportController.getProfitLoss);
    router.get('/cash-flow', reportController.getCashFlow);
    router.get('/trial-balance', reportController.getTrialBalance);
    router.get('/aged-receivables', reportController.getAgedReceivables);
    router.get('/aged-payables', reportController.getAgedPayables);

    app.use('/api/reports', router);
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OWNER Role - Full Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('OWNER');
    });

    it('should allow OWNER to access balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow OWNER to access profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow OWNER to access cash flow', async () => {
      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow OWNER to access trial balance', async () => {
      const response = await request(app)
        .get('/api/reports/trial-balance')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow OWNER to access aged receivables', async () => {
      const response = await request(app)
        .get('/api/reports/aged-receivables')
        .query({ asOfDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow OWNER to access aged payables', async () => {
      const response = await request(app)
        .get('/api/reports/aged-payables')
        .query({ asOfDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('MANAGER Role - Full Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('MANAGER');
    });

    it('should allow MANAGER to access balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow MANAGER to access profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow MANAGER to access cash flow', async () => {
      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('ACCOUNTANT Role - Full Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('ACCOUNTANT');
    });

    it('should allow ACCOUNTANT to access balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow ACCOUNTANT to access profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow ACCOUNTANT to access trial balance', async () => {
      const response = await request(app)
        .get('/api/reports/trial-balance')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('RECEPTIONIST Role - No Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('RECEPTIONIST');
    });

    it('should deny RECEPTIONIST access to balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny RECEPTIONIST access to profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny RECEPTIONIST access to cash flow', async () => {
      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny RECEPTIONIST access to trial balance', async () => {
      const response = await request(app)
        .get('/api/reports/trial-balance')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny RECEPTIONIST access to aged receivables', async () => {
      const response = await request(app)
        .get('/api/reports/aged-receivables')
        .query({ asOfDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny RECEPTIONIST access to aged payables', async () => {
      const response = await request(app)
        .get('/api/reports/aged-payables')
        .query({ asOfDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('MECHANIC Role - No Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('MECHANIC');
    });

    it('should deny MECHANIC access to balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny MECHANIC access to profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny MECHANIC access to cash flow', async () => {
      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('HR_MANAGER Role - No Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('HR_MANAGER');
    });

    it('should deny HR_MANAGER access to balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny HR_MANAGER access to profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('MANAGER_SALES Role - No Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('MANAGER_SALES');
    });

    it('should deny MANAGER_SALES access to balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny MANAGER_SALES access to profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('MANAGER_WAREHOUSE Role - No Access', () => {
    let app: express.Application;

    beforeAll(() => {
      app = createAppWithAuth('MANAGER_WAREHOUSE');
    });

    it('should deny MANAGER_WAREHOUSE access to balance sheet', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should deny MANAGER_WAREHOUSE access to profit and loss', async () => {
      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('No Authentication', () => {
    let app: express.Application;

    beforeAll(() => {
      app = express();
      app.use(express.json());

      // No authentication middleware
      reportController = new ReportController();

      // Mock the report service methods
      reportController['reportService'] = {
        generateBalanceSheet: jest.fn().mockResolvedValue({
          assets: { total: 1000000 },
          liabilities: { total: 400000 },
          equity: { total: 600000 },
        }),
      } as any;

      const router = express.Router();
      router.get('/balance-sheet', reportController.getBalanceSheet);
      app.use('/api/reports', router);
    });

    it('should return 500 when no user is authenticated', async () => {
      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

      // Controller will fail because req.user is undefined
      expect(response.status).toBe(500);
    });
  });
});
