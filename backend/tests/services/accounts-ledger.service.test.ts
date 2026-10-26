export {};

const mockPrisma: any = {
  account: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  journalLine: { groupBy: jest.fn(), count: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: mockPrisma }));

const { AccountService } = require('../../src/modules/accounts/service');

const row = (id: string, code: string, accountType: string, parentId: string | null = null) => ({
  id,
  code,
  nameAr: code,
  nameEn: code,
  accountType,
  parentId,
  isActive: true,
  tenantId: 'tenant-1',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

describe('account balances come from the ledger', () => {
  const service = new AccountService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows natural balances (negative = abnormal) and rolls child balances up into parents', async () => {
    mockPrisma.account.findMany.mockResolvedValue([
      row('parent', '1100', 'ASSET'),
      row('cash', '1110', 'ASSET', 'parent'),
      row('payable', '2110', 'LIABILITY'),
    ]);
    mockPrisma.journalLine.groupBy.mockResolvedValue([
      { accountId: 'cash', _sum: { debitSYP: 500, creditSYP: 200, debitUSD: 0, creditUSD: 0 } },
      { accountId: 'payable', _sum: { debitSYP: 0, creditSYP: 100, debitUSD: 0, creditUSD: 10 } },
    ]);

    const tree = await service.getAccountTree('tenant-1');
    const parent = tree.find((node: any) => node.id === 'parent');
    const payable = tree.find((node: any) => node.id === 'payable');

    expect(parent.children[0].balanceSYP).toBe(300);
    expect(parent.balanceSYP).toBe(300);
    expect(payable.balanceSYP).toBe(100);
    expect(payable.balanceUSD).toBe(10);
    expect(parent.parentId).toBeNull();
    expect(parent.children[0].parentId).toBe('parent');
  });

  it('refuses to change a balance through an account update', async () => {
    await expect(service.updateAccount('tenant-1', 'cash', { balanceSYP: 5 }))
      .rejects.toThrow('balance adjustment');
    expect(mockPrisma.account.update).not.toHaveBeenCalled();
  });

  it('refuses to change the type of an account that already has postings', async () => {
    mockPrisma.account.findFirst.mockResolvedValue(row('cash', '1110', 'ASSET'));
    mockPrisma.journalLine.count.mockResolvedValue(3);

    await expect(service.updateAccount('tenant-1', 'cash', { accountType: 'EXPENSE' }))
      .rejects.toThrow('cannot change after postings exist');
    expect(mockPrisma.account.update).not.toHaveBeenCalled();
  });

  it('refuses a non-zero opening balance on creation and accepts a zero one', async () => {
    await expect(service.createAccount('tenant-1', { code: '1200', nameAr: 'x', accountType: 'ASSET', balanceUSD: 10 }))
      .rejects.toThrow('balance adjustment');
    expect(mockPrisma.account.create).not.toHaveBeenCalled();

    mockPrisma.account.findFirst.mockResolvedValue(null);
    mockPrisma.account.create.mockResolvedValue(row('new', '1200', 'ASSET'));
    mockPrisma.journalLine.groupBy.mockResolvedValue([]);
    const created = await service.createAccount('tenant-1', { code: '1200', nameAr: 'x', accountType: 'ASSET', balanceSYP: 0 });

    expect(created).toEqual(expect.objectContaining({ id: 'new', balanceSYP: 0, balanceUSD: 0 }));
    expect(mockPrisma.account.create).toHaveBeenCalledTimes(1);
  });
});
