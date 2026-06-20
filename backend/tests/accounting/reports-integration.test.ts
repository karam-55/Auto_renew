/**
 * Integration Tests for Report Service
 * Tests ReportService.generateBalanceSheet, generateProfitLoss, etc.
 * with mocked database calls.
 */

import { ReportService } from '../../src/modules/reports/service';
import prisma from '../../src/config/database';

// Mock prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    account: { findMany: jest.fn() },
    journalLine: { findMany: jest.fn(), aggregate: jest.fn() },
    journalEntry: { findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    customer: { findMany: jest.fn() },
    fiscalPeriod: { findFirst: jest.fn() },
    $disconnect: jest.fn(),
    $use: jest.fn(),
  },
}));

describe('ReportService Integration', () => {
  const service = new ReportService();
  const tenantId = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBalanceSheet', () => {
    it('calculates correct balances per account type', async () => {
      // Mock accounts (findMany called once for all active accounts)
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { id: 'acc-1', nameAr: 'Cash', nameEn: 'Cash', accountType: 'ASSET', code: '1000', isActive: true },
        { id: 'acc-2', nameAr: 'Equipment', nameEn: 'Equipment', accountType: 'ASSET', code: '1500', isActive: true },
        { id: 'acc-3', nameAr: 'Loans Payable', nameEn: 'Loans Payable', accountType: 'LIABILITY', code: '2000', isActive: true },
        { id: 'acc-4', nameAr: 'Capital', nameEn: 'Capital', accountType: 'EQUITY', code: '3000', isActive: true },
        { id: 'acc-5', nameAr: 'Service Revenue', nameEn: 'Service Revenue', accountType: 'REVENUE', code: '4000', isActive: true },
        { id: 'acc-6', nameAr: 'Parts COGS', nameEn: 'Parts COGS', accountType: 'COGS', code: '5100', isActive: true },
        { id: 'acc-7', nameAr: 'Rent Expense', nameEn: 'Rent Expense', accountType: 'EXPENSE', code: '6100', isActive: true },
      ]);

      // Mock journal lines with REAL values (include: { account: true })
      (prisma.journalLine.findMany as jest.Mock).mockResolvedValue([
        // Cash: Debit 500,000, Credit 200,000 → Balance = 300,000 (ASSET: Dr-Cr)
        { accountId: 'acc-1', account: { accountType: 'ASSET', id: 'acc-1' }, debitSYP: 500000, creditSYP: 0 },
        { accountId: 'acc-1', account: { accountType: 'ASSET', id: 'acc-1' }, debitSYP: 0, creditSYP: 200000 },
        // Equipment: Debit 200,000 → Balance = 200,000
        { accountId: 'acc-2', account: { accountType: 'ASSET', id: 'acc-2' }, debitSYP: 200000, creditSYP: 0 },
        // Loans Payable: Credit 100,000 → Balance = 100,000 (LIABILITY: Cr-Dr)
        { accountId: 'acc-3', account: { accountType: 'LIABILITY', id: 'acc-3' }, debitSYP: 0, creditSYP: 100000 },
        // Capital: Credit 300,000 → Balance = 300,000 (EQUITY: Cr-Dr)
        { accountId: 'acc-4', account: { accountType: 'EQUITY', id: 'acc-4' }, debitSYP: 0, creditSYP: 300000 },
        // Service Revenue: Credit 700,000 → Balance = 700,000 (REVENUE: Cr-Dr)
        { accountId: 'acc-5', account: { accountType: 'REVENUE', id: 'acc-5' }, debitSYP: 0, creditSYP: 700000 },
        // Parts COGS: Debit 200,000 → Balance = 200,000 (COGS: Dr-Cr)
        { accountId: 'acc-6', account: { accountType: 'COGS', id: 'acc-6' }, debitSYP: 200000, creditSYP: 0 },
        // Rent Expense: Debit 170,000 → Balance = 170,000 (EXPENSE: Dr-Cr)
        { accountId: 'acc-7', account: { accountType: 'EXPENSE', id: 'acc-7' }, debitSYP: 170000, creditSYP: 0 },
      ]);

      const result = await service.generateBalanceSheet(tenantId, {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
      });

      // Verify structure
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('liabilities');
      expect(result).toHaveProperty('equity');
      expect(result).toHaveProperty('totalAssets');
      expect(result).toHaveProperty('totalLiabilities');
      expect(result).toHaveProperty('totalEquity');
      expect(result).toHaveProperty('isBalanced');

      // Cash balance = 500,000 - 200,000 = 300,000
      const cashAccount = result.assets.accounts.find(
        (a: any) => a.accountId === 'acc-1'
      );
      expect(cashAccount).toBeDefined();
      expect(cashAccount!.balance).toBe(300000);

      // Equipment balance = 200,000
      const equipAccount = result.assets.accounts.find(
        (a: any) => a.accountId === 'acc-2'
      );
      expect(equipAccount).toBeDefined();
      expect(equipAccount!.balance).toBe(200000);

      // Total Assets = 300,000 + 200,000 = 500,000
      expect(result.totalAssets).toBe(500000);

      // Loans balance = 100,000
      const loanAccount = result.liabilities.accounts.find(
        (a: any) => a.accountId === 'acc-3'
      );
      expect(loanAccount).toBeDefined();
      expect(loanAccount!.balance).toBe(100000);

      // Total Liabilities = 100,000
      expect(result.totalLiabilities).toBe(100000);

      // Capital balance = 300,000
      const capAccount = result.equity.accounts.find(
        (a: any) => a.accountId === 'acc-4'
      );
      expect(capAccount).toBeDefined();
      expect(capAccount!.balance).toBe(300000);

      // Retained Earnings = Revenue 700,000 - COGS 200,000 - Expenses 170,000 = 330,000
      // Total Equity = Capital 300,000 + Retained Earnings 330,000 = 630,000
      expect(result.totalEquity).toBe(630000);

      // Balance Sheet equation: Assets = Liabilities + Equity
      // 500,000 = 100,000 + 630,000? No! 500,000 ≠ 730,000
      // This is expected because our test data is not internally balanced.
      // The test correctly shows isBalanced = false
      expect(result.isBalanced).toBe(false);
    });
  });

  describe('generateProfitLoss', () => {
    it('calculates correct P&L with COGS separated', async () => {
      // Mock journal lines (with include: { account: true })
      (prisma.journalLine.findMany as jest.Mock).mockResolvedValue([
        // Revenue: Credit 700,000 (REVENUE: amount = credit - debit)
        { accountId: 'rev-1', account: { accountType: 'REVENUE', id: 'rev-1' }, debitSYP: 0, creditSYP: 500000 },
        { accountId: 'rev-1', account: { accountType: 'REVENUE', id: 'rev-1' }, debitSYP: 0, creditSYP: 200000 },
        // COGS: Debit 200,000 (COGS: amount = debit - credit)
        { accountId: 'cogs-1', account: { accountType: 'COGS', id: 'cogs-1' }, debitSYP: 120000, creditSYP: 0 },
        { accountId: 'cogs-2', account: { accountType: 'COGS', id: 'cogs-2' }, debitSYP: 80000, creditSYP: 0 },
        // Expenses: Debit 170,000 (EXPENSE: amount = debit - credit)
        { accountId: 'exp-1', account: { accountType: 'EXPENSE', id: 'exp-1' }, debitSYP: 50000, creditSYP: 0 },
        { accountId: 'exp-2', account: { accountType: 'EXPENSE', id: 'exp-2' }, debitSYP: 100000, creditSYP: 0 },
        { accountId: 'exp-3', account: { accountType: 'EXPENSE', id: 'exp-3' }, debitSYP: 20000, creditSYP: 0 },
      ]);

      // Mock accounts lookup (must match the accountIds in journal lines)
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { id: 'rev-1', nameAr: 'Service Revenue', nameEn: 'Service Revenue', accountType: 'REVENUE', code: '4000', isActive: true },
        { id: 'cogs-1', nameAr: 'Parts COGS', nameEn: 'Parts COGS', accountType: 'COGS', code: '5100', isActive: true },
        { id: 'cogs-2', nameAr: 'Labor COGS', nameEn: 'Labor COGS', accountType: 'COGS', code: '5200', isActive: true },
        { id: 'exp-1', nameAr: 'Rent', nameEn: 'Rent', accountType: 'EXPENSE', code: '6100', isActive: true },
        { id: 'exp-2', nameAr: 'Salaries', nameEn: 'Salaries', accountType: 'EXPENSE', code: '6200', isActive: true },
        { id: 'exp-3', nameAr: 'Utilities', nameEn: 'Utilities', accountType: 'EXPENSE', code: '6300', isActive: true },
      ]);

      const result = await service.generateProfitLoss(tenantId, {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
      });

      // Verify structure
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('cogs');
      expect(result).toHaveProperty('expenses');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('netProfit');

      // Revenue total = 500,000 + 200,000 = 700,000
      expect(result.revenue.total).toBe(700000);

      // COGS total = 120,000 + 80,000 = 200,000
      expect(result.cogs.total).toBe(200000);

      // Expenses total = 50,000 + 100,000 + 20,000 = 170,000
      expect(result.expenses.total).toBe(170000);

      // Gross Profit = 700,000 - 200,000 = 500,000
      expect(result.grossProfit).toBe(500000);

      // Net Profit = 500,000 - 170,000 = 330,000
      expect(result.netProfit).toBe(330000);
    });

    it('COGS section exists with accounts', async () => {
      (prisma.journalLine.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.generateProfitLoss(tenantId, {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
      });

      expect(result.cogs).toBeDefined();
      expect(result.cogs.sectionType).toBe('COGS');
      expect(Array.isArray(result.cogs.accounts)).toBe(true);
    });
  });

  describe('generateTrialBalance', () => {
    it('correctly computes debit/credit per account type', async () => {
      // Service calls account.findMany for ALL active accounts
      (prisma.account.findMany as jest.Mock).mockResolvedValue([
        { id: 'a1', nameAr: 'Cash', nameEn: 'Cash', accountType: 'ASSET', code: '1000', isActive: true },
        { id: 'a2', nameAr: 'Revenue', nameEn: 'Revenue', accountType: 'REVENUE', code: '4000', isActive: true },
        { id: 'a3', nameAr: 'COGS', nameEn: 'COGS', accountType: 'COGS', code: '5100', isActive: true },
        { id: 'a4', nameAr: 'Expense', nameEn: 'Expense', accountType: 'EXPENSE', code: '6100', isActive: true },
      ]);

      // Service calls journalLine.findMany with include: { account: true }
      (prisma.journalLine.findMany as jest.Mock).mockResolvedValue([
        // ASSET: Dr 500, Cr 200 → Balance = 300 (DEBIT)
        { accountId: 'a1', account: { accountType: 'ASSET' }, debitSYP: 500000, creditSYP: 0 },
        { accountId: 'a1', account: { accountType: 'ASSET' }, debitSYP: 0, creditSYP: 200000 },
        // REVENUE: Cr 700, Dr 0 → Balance = 700 (CREDIT)
        { accountId: 'a2', account: { accountType: 'REVENUE' }, debitSYP: 0, creditSYP: 700000 },
        // COGS: Dr 200 → Balance = 200 (DEBIT)
        { accountId: 'a3', account: { accountType: 'COGS' }, debitSYP: 200000, creditSYP: 0 },
        // EXPENSE: Dr 170 → Balance = 170 (DEBIT)
        { accountId: 'a4', account: { accountType: 'EXPENSE' }, debitSYP: 170000, creditSYP: 0 },
      ]);

      const result = await service.generateTrialBalance(tenantId, {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
      });

      // Find each account in result
      const cashAccount = result.accounts.find((a: any) => a.accountId === 'a1');
      const revenueAccount = result.accounts.find((a: any) => a.accountId === 'a2');
      const cogsAccount = result.accounts.find((a: any) => a.accountId === 'a3');
      const expenseAccount = result.accounts.find((a: any) => a.accountId === 'a4');

      // ASSET: normal debit balance = debit - credit
      expect(cashAccount!.balance).toBe(300000);
      expect(cashAccount!.balanceType).toBe('DEBIT');

      // REVENUE: normal credit balance = credit - debit
      expect(revenueAccount!.balance).toBe(700000);
      expect(revenueAccount!.balanceType).toBe('CREDIT');

      // COGS: normal debit balance = debit - credit
      expect(cogsAccount!.balance).toBe(200000);
      expect(cogsAccount!.balanceType).toBe('DEBIT');

      // EXPENSE: normal debit balance = debit - credit
      expect(expenseAccount!.balance).toBe(170000);
      expect(expenseAccount!.balanceType).toBe('DEBIT');

      // totalDebit = sum of all debitTotal columns = 500,000 + 0 + 200,000 + 170,000 = 870,000
      // totalCredit = sum of all creditTotal columns = 200,000 + 700,000 + 0 + 0 = 900,000
      expect(result.totalDebit).toBe(870000);
      expect(result.totalCredit).toBe(900000);
    });
  });
});
