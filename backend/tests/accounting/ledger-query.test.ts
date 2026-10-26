export {};

const mockPrisma: any = {
  journalLine: { groupBy: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: mockPrisma }));

const { loadLedgerTotals, buildBalanceSheet, buildIncomeStatement } = require('../../src/modules/accounting/ledger');
const { AccountType } = require('@prisma/client');

describe('ledger query contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only aggregates posted, non-deleted lines of the requested tenant and period', async () => {
    mockPrisma.journalLine.groupBy.mockResolvedValue([]);
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-10-31T23:59:59.999Z');

    await loadLedgerTotals('tenant-1', { from, to });

    const args = mockPrisma.journalLine.groupBy.mock.calls[0][0];
    expect(args.by).toEqual(['accountId']);
    expect(args.where.deletedAt).toBeNull();
    expect(args.where.entry).toEqual(expect.objectContaining({
      tenantId: 'tenant-1',
      status: 'POSTED',
      deletedAt: null,
      entryDate: { gte: from, lte: to },
    }));
  });

  it('leaves the date range open when none is given (cumulative balances)', async () => {
    mockPrisma.journalLine.groupBy.mockResolvedValue([]);

    await loadLedgerTotals('tenant-1', { to: new Date('2026-10-31T23:59:59.999Z') });

    const entry = mockPrisma.journalLine.groupBy.mock.calls[0][0].where.entry;
    expect(entry.entryDate.gte).toBeUndefined();
    expect(entry.entryDate.lte).toEqual(new Date('2026-10-31T23:59:59.999Z'));
  });

  it('maps grouped sums into per-account totals and treats null sums as zero', async () => {
    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: 'cash', _sum: { debitSYP: 120, creditSYP: null, debitUSD: 1.5, creditUSD: 0 } },
    ]);

    const totals = await loadLedgerTotals('tenant-1');

    expect(totals.get('cash')).toEqual({ debitSYP: 120, creditSYP: 0, debitUSD: 1.5, creditUSD: 0 });
  });

  it('a reversed entry nets to zero in both statements', () => {
    const accounts = [
      { id: 'cash', code: '1110', nameAr: 'cash', nameEn: 'cash', accountType: AccountType.ASSET },
      { id: 'sales', code: '4200', nameAr: 'sales', nameEn: 'sales', accountType: AccountType.REVENUE },
    ];
    const totals = new Map([
      ['cash', { debitSYP: 100, creditSYP: 100, debitUSD: 0, creditUSD: 0 }],
      ['sales', { debitSYP: 100, creditSYP: 100, debitUSD: 0, creditUSD: 0 }],
    ]);

    const bs = buildBalanceSheet(accounts, totals, 'SYP');
    const pl = buildIncomeStatement(accounts, totals, 'SYP');

    expect(bs.totalAssets).toBe(0);
    expect(bs.isBalanced).toBe(true);
    expect(pl.totalRevenue).toBe(0);
    expect(pl.netIncome).toBe(0);
  });
});
