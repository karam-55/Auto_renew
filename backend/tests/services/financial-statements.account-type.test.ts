export {};

const prismaMock: any = {
  account: { findMany: jest.fn() },
  journalLine: { findMany: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));

const { IncomeStatementService } = require('../../src/modules/financial/income-statement.service');
const { BalanceSheetService } = require('../../src/modules/financial/balance-sheet.service');

describe('financial statements use Prisma accountType', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calculates revenue, direct costs, operating expenses, and net income', async () => {
    prismaMock.account.findMany.mockResolvedValue([
      { id: 'revenue', code: '4100', nameEn: 'Service revenue', nameAr: 'إيرادات الخدمات', accountType: 'REVENUE' },
      { id: 'cogs', code: '5100', nameEn: 'Cost of materials', nameAr: 'تكلفة المواد', accountType: 'COGS' },
      { id: 'expense', code: '6200', nameEn: 'Utilities', nameAr: 'مصاريف تشغيلية', accountType: 'EXPENSE' },
    ]);
    prismaMock.journalLine.findMany.mockImplementation(({ where }: any) => {
      const rows: Record<string, any[]> = {
        revenue: [{ debitSYP: 0, creditSYP: 1000, debitUSD: 0, creditUSD: 7.14 }],
        cogs: [{ debitSYP: 300, creditSYP: 0, debitUSD: 2.14, creditUSD: 0 }],
        expense: [{ debitSYP: 100, creditSYP: 0, debitUSD: 0.71, creditUSD: 0 }],
      };
      const accountId = where.accountId;
      return Promise.resolve(rows[accountId] || []);
    });

    const report = await new IncomeStatementService().generateIncomeStatement(
      'tenant-1',
      new Date('2026-10-01T00:00:00.000Z'),
      new Date('2026-10-31T23:59:59.999Z'),
    );

    expect(report.totalRevenueSYP).toBe(1000);
    expect(report.totalCostOfGoodsSoldSYP).toBe(300);
    expect(report.totalOperatingExpensesSYP).toBe(100);
    expect(report.grossProfitSYP).toBe(700);
    expect(report.netIncomeSYP).toBe(600);
    expect(report.sections.revenue.items[0].accountNameAr).toBe('إيرادات الخدمات');
  });

  it('builds a balanced balance sheet and retained earnings from accountType', async () => {
    const accounts = [
      { id: 'asset', code: '1100', nameEn: 'Cash', nameAr: 'الصندوق', accountType: 'ASSET' },
      { id: 'liability', code: '2100', nameEn: 'Payables', nameAr: 'الذمم الدائنة', accountType: 'LIABILITY' },
      { id: 'equity', code: '3100', nameEn: 'Capital', nameAr: 'رأس المال', accountType: 'EQUITY' },
      { id: 'revenue', code: '4100', nameEn: 'Revenue', nameAr: 'الإيرادات', accountType: 'REVENUE' },
      { id: 'expense', code: '6200', nameEn: 'Utilities', nameAr: 'مصاريف تشغيلية', accountType: 'EXPENSE' },
    ];
    const lines = [
      { accountId: 'asset', debitSYP: 1200, creditSYP: 0, debitUSD: 8.57, creditUSD: 0 },
      { accountId: 'liability', debitSYP: 0, creditSYP: 200, debitUSD: 0, creditUSD: 1.43 },
      { accountId: 'equity', debitSYP: 0, creditSYP: 400, debitUSD: 0, creditUSD: 2.86 },
      { accountId: 'revenue', debitSYP: 0, creditSYP: 700, debitUSD: 0, creditUSD: 5 },
      { accountId: 'expense', debitSYP: 100, creditSYP: 0, debitUSD: 0.71, creditUSD: 0 },
    ];
    prismaMock.account.findMany.mockResolvedValue(accounts);
    prismaMock.journalLine.findMany.mockImplementation(({ where }: any) =>
      Promise.resolve(lines.filter((line) => line.accountId === where.accountId)),
    );

    const report = await new BalanceSheetService().generateBalanceSheet(
      'tenant-1',
      new Date('2026-10-31T23:59:59.999Z'),
    );

    expect(report.totalAssetsSYP).toBe(1200);
    expect(report.totalLiabilitiesSYP).toBe(200);
    expect(report.totalEquitySYP).toBe(1000);
    expect(report.totalAssetsSYP).toBe(report.totalLiabilitiesSYP + report.totalEquitySYP);
    expect(report.sections.assets.items[0].accountNameAr).toBe('الصندوق');
  });
});
