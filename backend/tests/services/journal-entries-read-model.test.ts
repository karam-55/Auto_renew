export {};

const prismaMock: any = {
  journalEntry: { findMany: jest.fn() },
  journalLine: { findMany: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));

const { JournalEntryService } = require('../../src/modules/journal-entries/service');
const { GeneralLedgerService } = require('../../src/modules/general-ledger/service');

describe('accounting read models', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns journal dates, Arabic account names, and nonzero debit/credit totals', async () => {
    prismaMock.journalEntry.findMany.mockResolvedValue([{
      id: 'entry-1',
      tenantId: 'tenant-1',
      entryDate: new Date('2026-10-17T10:00:00.000Z'),
      reference: 'INV-2026-00001',
      description: 'Invoice INV-2026-00001',
      status: 'POSTED',
      isReversing: false,
      isReversed: false,
      lines: [
        {
          id: 'line-1',
          entryId: 'entry-1',
          accountId: 'cash',
          account: { code: '1100', name: 'Main cash', nameAr: 'الصندوق الرئيسي', accountType: 'ASSET' },
          debitSYP: 14000,
          debitUSD: 100,
          creditSYP: 0,
          creditUSD: 0,
          createdAt: new Date('2026-10-17T10:00:00.000Z'),
        },
        {
          id: 'line-2',
          entryId: 'entry-1',
          accountId: 'revenue',
          account: { code: '4100', name: 'Service revenue', nameAr: 'إيرادات الصيانة', accountType: 'REVENUE' },
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: 14000,
          creditUSD: 100,
          createdAt: new Date('2026-10-17T10:00:00.000Z'),
        },
      ],
    }]);

    const entries = await new JournalEntryService().getJournalEntries('tenant-1', { limit: 200 });

    expect(entries).toHaveLength(1);
    expect(entries[0].entryDate).toEqual(new Date('2026-10-17T10:00:00.000Z'));
    expect(entries[0].totalDebitSYP).toBe(14000);
    expect(entries[0].totalCreditSYP).toBe(14000);
    expect(entries[0].totalDebitUSD).toBe(100);
    expect(entries[0].totalCreditUSD).toBe(100);
    expect(entries[0].lines?.[0]).toEqual(expect.objectContaining({
      accountCode: '1100',
      accountNameAr: 'الصندوق الرئيسي',
      debitSYP: 14000,
    }));
  });

  it('returns ledger sections with Arabic account names and running balances', async () => {
    prismaMock.journalLine.findMany
      .mockResolvedValueOnce([{
        id: 'line-1',
        entryId: 'entry-1',
        accountId: 'cash',
        debitSYP: 14000,
        debitUSD: 100,
        creditSYP: 0,
        creditUSD: 0,
        description: 'Payment received',
        account: { code: '1100', name: 'Main cash', nameAr: 'الصندوق الرئيسي', accountType: 'ASSET' },
        entry: {
          id: 'entry-1',
          entryDate: new Date('2026-10-17T10:00:00.000Z'),
          reference: 'PAY-1',
          description: 'Payment received',
          sourceType: 'PAYMENT',
        },
      }])
      .mockResolvedValueOnce([]);

    const report = await new GeneralLedgerService().generateGeneralLedger('tenant-1', { limit: 500 });

    expect(report.sections).toHaveLength(1);
    expect(report.sections[0]).toEqual(expect.objectContaining({
      accountCode: '1100',
      accountNameAr: 'الصندوق الرئيسي',
      totalDebitSYP: 14000,
      closingBalanceSYP: 14000,
    }));
    expect(report.sections[0].lines[0]).toEqual(expect.objectContaining({
      entryDate: new Date('2026-10-17T10:00:00.000Z'),
      debitSYP: 14000,
      runningBalanceSYP: 14000,
      runningBalanceUSD: 100,
    }));
  });
});
