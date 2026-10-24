export {};

const prismaMock: any = {
  journalLine: { findMany: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));
jest.doMock('../../src/modules/accounting/automatic-journal-entries', () => ({
  getAccountIdByRole: jest.fn(async (_tenantId: string, role: string) => role === 'CASH' ? 'cash' : 'bank'),
}));

const { ReportService } = require('../../src/modules/reports/service');

describe('cash flow from posted cash and bank journal movements', () => {
  beforeEach(() => jest.clearAllMocks());

  it('nets reversed receipts and includes direct cash outflows exactly once', async () => {
    const date = new Date('2026-10-17T12:00:00.000Z');
    prismaMock.journalLine.findMany.mockImplementation(({ where }: any) => {
      if (where.entry.entryDate.lt) return Promise.resolve([]);
      return Promise.resolve([
        {
          id: 'payment-line',
          entryId: 'payment',
          accountId: 'cash',
          debitSYP: 100,
          creditSYP: 0,
          debitUSD: 1,
          creditUSD: 0,
          description: 'Payment received',
          entry: {
            id: 'payment',
            entryDate: date,
            reference: 'PAY-1',
            description: 'Payment received',
            sourceType: 'PAYMENT',
            lines: [{ accountId: 'receivable', account: { code: '1200', accountType: 'ASSET' } }],
          },
        },
        {
          id: 'expense-line',
          entryId: 'expense',
          accountId: 'cash',
          debitSYP: 0,
          creditSYP: 50,
          debitUSD: 0,
          creditUSD: 0.5,
          description: 'Workshop expense',
          entry: {
            id: 'expense',
            entryDate: date,
            reference: 'EXP-1',
            description: 'Workshop expense',
            sourceType: 'EXPENSE',
            lines: [{ accountId: 'expense-account', account: { code: '6500', accountType: 'EXPENSE' } }],
          },
        },
        {
          id: 'original-receipt',
          entryId: 'original-receipt',
          accountId: 'cash',
          debitSYP: 150,
          creditSYP: 0,
          debitUSD: 1.5,
          creditUSD: 0,
          description: 'Payment received',
          entry: {
            id: 'original-receipt',
            entryDate: date,
            reference: 'PAY-2',
            description: 'Payment received',
            sourceType: 'PAYMENT',
            isReversed: true,
            lines: [{ accountId: 'receivable', account: { code: '1200', accountType: 'ASSET' } }],
          },
        },
        {
          id: 'reversal-receipt',
          entryId: 'reversal-receipt',
          accountId: 'cash',
          debitSYP: 0,
          creditSYP: 150,
          debitUSD: 0,
          creditUSD: 1.5,
          description: 'Reversal of payment',
          entry: {
            id: 'reversal-receipt',
            entryDate: date,
            reference: 'REV-PAY-2',
            description: 'Reversal of payment',
            sourceType: 'REVERSAL_OF_PAYMENT',
            lines: [{ accountId: 'receivable', account: { code: '1200', accountType: 'ASSET' } }],
          },
        },
      ]);
    });

    const report = await new ReportService().generateCashFlow('tenant-1', {
      fromDate: new Date('2026-10-01T00:00:00.000Z'),
      toDate: new Date('2026-10-31T23:59:59.999Z'),
      currency: 'SYP',
    });

    expect(report.operating.totalInflow).toBe(100);
    expect(report.operating.totalOutflow).toBe(50);
    expect(report.netCashFlow).toBe(50);
    expect(report.endingCash).toBe(50);
    expect(report.operating.inflows).toHaveLength(1);
    expect(report.operating.outflows).toHaveLength(1);
  });
});
