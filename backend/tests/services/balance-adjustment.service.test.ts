import { AccountType } from '@prisma/client';

const mockTx: any = {
  account: { findFirst: jest.fn() },
  journalLine: { aggregate: jest.fn() },
};
const mockCreateJournalEntry = jest.fn();
const mockEnsureDefaultAccounts = jest.fn();
const mockGetAccountIdByRole = jest.fn();
const mockAuditLog = jest.fn();

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: { $transaction: (fn: any) => fn(mockTx) },
}));
jest.mock('../../src/modules/accounting/automatic-journal-entries', () => ({
  createJournalEntry: (...args: any[]) => mockCreateJournalEntry(...args),
  ensureDefaultAccounts: (...args: any[]) => mockEnsureDefaultAccounts(...args),
  getAccountIdByRole: (...args: any[]) => mockGetAccountIdByRole(...args),
}));
jest.mock('../../src/infrastructure/logging/audit-log', () => ({
  AuditLog: { log: (...args: any[]) => mockAuditLog(...args) },
}));

import { AccountBalanceAdjustmentService } from '../../src/modules/accounts/balance-adjustment.service';

const cashAccount = {
  id: 'cash',
  code: '1110',
  nameAr: 'الصندوق',
  accountType: AccountType.ASSET,
  isActive: true,
  deletedAt: null,
  children: [],
};

const payableAccount = {
  ...cashAccount,
  id: 'payable',
  code: '2110',
  nameAr: 'مستحقات الموردين',
  accountType: AccountType.LIABILITY,
};

const sums = (values: Partial<Record<'debitSYP' | 'creditSYP' | 'debitUSD' | 'creditUSD', number>>) => ({
  _sum: { debitSYP: 0, creditSYP: 0, debitUSD: 0, creditUSD: 0, ...values },
});

describe('AccountBalanceAdjustmentService', () => {
  const service = new AccountBalanceAdjustmentService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountIdByRole.mockResolvedValue('offset');
    mockCreateJournalEntry.mockResolvedValue({ id: 'entry-1' });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('posts an SYP increase on an asset against opening balances', async () => {
    mockTx.account.findFirst.mockResolvedValue(cashAccount);
    mockTx.journalLine.aggregate.mockResolvedValue(sums({ debitSYP: 100 }));

    const result = await service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 50 });

    const [tenantId, , , reference, sourceType, , userId, lines] = mockCreateJournalEntry.mock.calls[0];
    expect(tenantId).toBe('tenant-1');
    expect(reference).toBe('ADJ-1110');
    expect(sourceType).toBe('ACCOUNT_BALANCE_ADJUSTMENT');
    expect(userId).toBe('user-1');
    expect(lines).toEqual([
      expect.objectContaining({ accountId: 'cash', debitSYP: 50, creditSYP: 0, debitUSD: 0, creditUSD: 0 }),
      expect.objectContaining({ accountId: 'offset', debitSYP: 0, creditSYP: 50, debitUSD: 0, creditUSD: 0 }),
    ]);
    expect(result).toEqual(expect.objectContaining({ balanceBefore: 100, balanceAfter: 150, side: 'DEBIT', amount: 50 }));
    expect(mockAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'ACCOUNT_BALANCE_ADJUSTED', entityId: 'cash' }));
  });

  it('sets a USD liability to zero by debiting it and crediting the offset in USD only', async () => {
    mockTx.account.findFirst.mockResolvedValue(payableAccount);
    mockTx.journalLine.aggregate.mockResolvedValue(sums({ creditUSD: 30 }));

    const result = await service.adjustBalance('tenant-1', 'payable', 'user-1', { currency: 'USD', mode: 'SET', amount: 0 });

    const lines = mockCreateJournalEntry.mock.calls[0][7];
    expect(lines).toEqual([
      expect.objectContaining({ accountId: 'payable', debitUSD: 30, creditUSD: 0, debitSYP: 0, creditSYP: 0 }),
      expect.objectContaining({ accountId: 'offset', creditUSD: 30, debitUSD: 0, debitSYP: 0, creditSYP: 0 }),
    ]);
    expect(result).toEqual(expect.objectContaining({ balanceBefore: 30, balanceAfter: 0, side: 'DEBIT' }));
  });

  it('rejects parent accounts', async () => {
    mockTx.account.findFirst.mockResolvedValue({ ...cashAccount, children: [{ id: 'child' }] });

    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 10 }))
      .rejects.toThrow('Parent accounts cannot receive direct balance adjustments');
    expect(mockCreateJournalEntry).not.toHaveBeenCalled();
  });

  it('rejects inactive accounts', async () => {
    mockTx.account.findFirst.mockResolvedValue({ ...cashAccount, isActive: false });

    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 10 }))
      .rejects.toThrow('Inactive accounts cannot receive balance adjustments');
  });

  it('rejects adjusting the opening balance equity account itself', async () => {
    mockTx.account.findFirst.mockResolvedValue({ ...cashAccount, id: 'offset', accountType: AccountType.EQUITY });

    await expect(service.adjustBalance('tenant-1', 'offset', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 10 }))
      .rejects.toThrow('cannot be adjusted directly');
  });

  it('creates the opening balance equity mapping when it is missing', async () => {
    mockTx.account.findFirst.mockResolvedValue(cashAccount);
    mockTx.journalLine.aggregate.mockResolvedValue(sums({}));
    mockGetAccountIdByRole.mockResolvedValueOnce(null).mockResolvedValueOnce('offset');

    await service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 10 });

    expect(mockEnsureDefaultAccounts).toHaveBeenCalledWith('tenant-1', mockTx);
    expect(mockCreateJournalEntry).toHaveBeenCalledTimes(1);
  });

  it('rejects zero-value adjustments and no-op targets', async () => {
    mockTx.account.findFirst.mockResolvedValue(cashAccount);
    mockTx.journalLine.aggregate.mockResolvedValue(sums({ debitSYP: 200 }));

    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'ADD', amount: 0 }))
      .rejects.toThrow('Amount must be a positive number');
    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'SET', amount: 200 }))
      .rejects.toThrow('nothing to adjust');
    expect(mockCreateJournalEntry).not.toHaveBeenCalled();
  });

  it('rejects unknown currencies and modes', async () => {
    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'EUR' as any, mode: 'ADD', amount: 1 }))
      .rejects.toThrow('Currency must be SYP or USD');
    await expect(service.adjustBalance('tenant-1', 'cash', 'user-1', { currency: 'SYP', mode: 'MULTIPLY' as any, amount: 1 }))
      .rejects.toThrow('Mode must be ADD, SUBTRACT or SET');
  });
});
