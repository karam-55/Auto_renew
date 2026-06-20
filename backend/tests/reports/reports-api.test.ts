import request from 'supertest';
import express from 'express';
import { ReportController } from '../../src/modules/reports/controller';

// Mock Auth Middleware
jest.mock('../../src/shared/middlewares/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      tenantId: 'tenant-123',
      role: 'OWNER',
    };
    next();
  },
  authorize: (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  },
}));

describe('Reports API Tests', () => {
  let app: express.Application;
  let reportController: ReportController;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    reportController = new ReportController();

    // Mock the report service methods
    reportController['reportService'] = {
      generateBalanceSheet: jest.fn().mockResolvedValue({
        assets: { total: 1000000 },
        liabilities: { total: 400000 },
        equity: { total: 600000 },
      }),
      exportBalanceSheetToPDF: jest.fn().mockResolvedValue({
        buffer: Buffer.from('mock pdf'),
        filename: 'test.pdf',
      }),
      exportBalanceSheetToExcel: jest.fn().mockResolvedValue({
        buffer: Buffer.from('mock excel'),
        filename: 'test.xlsx',
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

    // Setup routes
    const router = express.Router();
    router.get('/balance-sheet', reportController.getBalanceSheet);
    router.get('/balance-sheet/export/pdf', reportController.exportBalanceSheetPDF);
    router.get('/balance-sheet/export/excel', reportController.exportBalanceSheetExcel);
    router.get('/profit-loss', reportController.getProfitLoss);
    router.get('/cash-flow', reportController.getCashFlow);
    router.get('/trial-balance', reportController.getTrialBalance);
    router.get('/aged-receivables', reportController.getAgedReceivables);
    router.get('/aged-payables', reportController.getAgedPayables);

    app.use('/api/reports', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/balance-sheet', () => {
    it('should return balance sheet report for authorized user', async () => {
      const mockBalanceSheet = {
        assets: {
          currentAssets: {
            cash: 100000,
            accountsReceivable: 50000,
            inventory: 75000,
            total: 225000,
          },
          nonCurrentAssets: {
            fixedAssets: 500000,
            total: 500000,
          },
          total: 725000,
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable: 30000,
            total: 30000,
          },
          nonCurrentLiabilities: {
            loans: 100000,
            total: 100000,
          },
          total: 130000,
        },
        equity: {
          capital: 500000,
          retainedEarnings: 95000,
          total: 595000,
        },
        totalLiabilitiesAndEquity: 725000,
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateBalanceSheet as jest.Mock).mockResolvedValue(mockBalanceSheet);

      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.assets).toBeDefined();
      expect(response.body.data.liabilities).toBeDefined();
      expect(response.body.data.equity).toBeDefined();
    });

    it('should return 500 if service throws error', async () => {
      (reportController['reportService'].generateBalanceSheet as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/reports/balance-sheet')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/reports/balance-sheet/export/pdf', () => {
    it('should export balance sheet as PDF', async () => {
      const mockPDFBuffer = Buffer.from('mock pdf content');
      const mockFilename = 'balance-sheet-2024-12-31.pdf';

      (reportController['reportService'].exportBalanceSheetToPDF as jest.Mock).mockResolvedValue({
        buffer: mockPDFBuffer,
        filename: mockFilename,
      });

      const response = await request(app)
        .get('/api/reports/balance-sheet/export/pdf')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(mockFilename);
    });

    it('should return 500 if PDF export fails', async () => {
      (reportController['reportService'].exportBalanceSheetToPDF as jest.Mock).mockRejectedValue(
        new Error('PDF generation failed')
      );

      const response = await request(app)
        .get('/api/reports/balance-sheet/export/pdf')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/balance-sheet/export/excel', () => {
    it('should export balance sheet as Excel', async () => {
      const mockExcelBuffer = Buffer.from('mock excel content');
      const mockFilename = 'balance-sheet-2024-12-31.xlsx';

      (reportController['reportService'].exportBalanceSheetToExcel as jest.Mock).mockResolvedValue({
        buffer: mockExcelBuffer,
        filename: mockFilename,
      });

      const response = await request(app)
        .get('/api/reports/balance-sheet/export/excel')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(mockFilename);
    });

    it('should return 500 if Excel export fails', async () => {
      (reportController['reportService'].exportBalanceSheetToExcel as jest.Mock).mockRejectedValue(
        new Error('Excel generation failed')
      );

      const response = await request(app)
        .get('/api/reports/balance-sheet/export/excel')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/profit-loss', () => {
    it('should return profit and loss statement', async () => {
      const mockProfitLoss = {
        revenue: {
          serviceRevenue: 500000,
          partsRevenue: 300000,
          discountRevenue: -10000,
          total: 790000,
        },
        costOfGoodsSold: {
          partsCost: 200000,
          laborCost: 150000,
          total: 350000,
        },
        grossProfit: 440000,
        operatingExpenses: {
          rent: 50000,
          utilities: 10000,
          supplies: 15000,
          total: 75000,
        },
        operatingProfit: 365000,
        otherIncome: 5000,
        netProfit: 370000,
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateProfitLoss as jest.Mock).mockResolvedValue(mockProfitLoss);

      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.revenue).toBeDefined();
      expect(response.body.data.costOfGoodsSold).toBeDefined();
      expect(response.body.data.netProfit).toBe(370000);
    });

    it('should return 500 if profit loss generation fails', async () => {
      (reportController['reportService'].generateProfitLoss as jest.Mock).mockRejectedValue(
        new Error('Failed to generate P&L')
      );

      const response = await request(app)
        .get('/api/reports/profit-loss')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/cash-flow', () => {
    it('should return cash flow statement', async () => {
      const mockCashFlow = {
        operatingActivities: {
          cashFromCustomers: 600000,
          cashPaidToSuppliers: -200000,
          cashPaidForExpenses: -75000,
          net: 325000,
        },
        investingActivities: {
          purchaseOfAssets: -50000,
          net: -50000,
        },
        financingActivities: {
          loansReceived: 100000,
          loanRepayments: -20000,
          net: 80000,
        },
        netCashFlow: 355000,
        beginningCash: 100000,
        endingCash: 455000,
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateCashFlow as jest.Mock).mockResolvedValue(mockCashFlow);

      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.operatingActivities).toBeDefined();
      expect(response.body.data.netCashFlow).toBe(355000);
    });

    it('should return 500 if cash flow generation fails', async () => {
      (reportController['reportService'].generateCashFlow as jest.Mock).mockRejectedValue(
        new Error('Failed to generate cash flow')
      );

      const response = await request(app)
        .get('/api/reports/cash-flow')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/trial-balance', () => {
    it('should return trial balance report', async () => {
      const mockTrialBalance = {
        accounts: [
          {
            code: '1000',
            name: 'Cash',
            debit: 100000,
            credit: 0,
          },
          {
            code: '1200',
            name: 'Accounts Receivable',
            debit: 50000,
            credit: 0,
          },
          {
            code: '2000',
            name: 'Accounts Payable',
            debit: 0,
            credit: 30000,
          },
          {
            code: '4000',
            name: 'Service Revenue',
            debit: 0,
            credit: 500000,
          },
        ],
        totalDebit: 150000,
        totalCredit: 530000,
        isBalanced: false,
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateTrialBalance as jest.Mock).mockResolvedValue(mockTrialBalance);

      const response = await request(app)
        .get('/api/reports/trial-balance')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accounts).toBeDefined();
      expect(response.body.data.accounts).toHaveLength(4);
    });

    it('should return 500 if trial balance generation fails', async () => {
      (reportController['reportService'].generateTrialBalance as jest.Mock).mockRejectedValue(
        new Error('Failed to generate trial balance')
      );

      const response = await request(app)
        .get('/api/reports/trial-balance')
        .query({
          fromDate: '2024-01-01',
          toDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/aged-receivables', () => {
    it('should return aged receivables report', async () => {
      const mockAgedReceivables = {
        customers: [
          {
            customerId: 'customer-1',
            customerName: 'Customer A',
            totalOutstanding: 50000,
            buckets: {
              current: 20000,
              days1to30: 15000,
              days31to60: 10000,
              days61to90: 3000,
              over90: 2000,
            },
          },
        ],
        summary: {
          totalOutstanding: 50000,
          current: 20000,
          days1to30: 15000,
          days31to60: 10000,
          days61to90: 3000,
          over90: 2000,
        },
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateAgedReceivables as jest.Mock).mockResolvedValue(mockAgedReceivables);

      const response = await request(app)
        .get('/api/reports/aged-receivables')
        .query({
          asOfDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.customers).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('should return 500 if aged receivables generation fails', async () => {
      (reportController['reportService'].generateAgedReceivables as jest.Mock).mockRejectedValue(
        new Error('Failed to generate aged receivables')
      );

      const response = await request(app)
        .get('/api/reports/aged-receivables')
        .query({
          asOfDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reports/aged-payables', () => {
    it('should return aged payables report', async () => {
      const mockAgedPayables = {
        suppliers: [
          {
            supplierId: 'supplier-1',
            supplierName: 'Supplier A',
            totalOutstanding: 30000,
            buckets: {
              current: 10000,
              days1to30: 8000,
              days31to60: 7000,
              days61to90: 3000,
              over90: 2000,
            },
          },
        ],
        summary: {
          totalOutstanding: 30000,
          current: 10000,
          days1to30: 8000,
          days31to60: 7000,
          days61to90: 3000,
          over90: 2000,
        },
        generatedAt: new Date(),
      };

      (reportController['reportService'].generateAgedPayables as jest.Mock).mockResolvedValue(mockAgedPayables);

      const response = await request(app)
        .get('/api/reports/aged-payables')
        .query({
          asOfDate: '2024-12-31',
          currency: 'SYP',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suppliers).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('should return 500 if aged payables generation fails', async () => {
      (reportController['reportService'].generateAgedPayables as jest.Mock).mockRejectedValue(
        new Error('Failed to generate aged payables')
      );

      const response = await request(app)
        .get('/api/reports/aged-payables')
        .query({
          asOfDate: '2024-12-31',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
