import { AccountController } from '../../src/modules/accounts/controller';

const mockService = { getAccounts: jest.fn(), getAccountTree: jest.fn(), getAccountById: jest.fn() };
jest.mock('../../src/modules/accounts/service', () => ({ AccountService: jest.fn(() => mockService) }));
jest.mock('../../src/modules/accounts/balance-adjustment.service', () => ({ AccountBalanceAdjustmentService: jest.fn(() => ({})) }));

const row = { id: 'a1', code: '3100', nameAr: 'رأس المال', accountType: 'EQUITY', balanceSYP: 17190000, balanceUSD: 0 };
const tree = [{ ...row, children: [{ ...row, id: 'a2', code: '3110', children: [] }] }];

const call = async (handler: any, role: string) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  await handler({ user: { id: 'u1', tenantId: 't1', role }, query: {}, params: { id: 'a1' } }, res);
  return res.json.mock.calls[0][0].data;
};

describe('account balance visibility by role', () => {
  const controller = new AccountController();

  beforeEach(() => {
    mockService.getAccounts.mockResolvedValue([row]);
    mockService.getAccountTree.mockResolvedValue(tree);
    mockService.getAccountById.mockResolvedValue(row);
  });

  it.each(['OWNER', 'MANAGER', 'ACCOUNTANT'])('keeps balances for %s', async (role) => {
    expect((await call(controller.getAccounts, role))[0]).toMatchObject({ balanceSYP: 17190000, balanceUSD: 0 });
    expect((await call(controller.getAccountById, role))).toMatchObject({ balanceSYP: 17190000 });
    const [root] = await call(controller.getAccountTree, role);
    expect(root).toMatchObject({ balanceSYP: 17190000 });
    expect(root.children[0]).toHaveProperty('balanceUSD', 0);
  });

  it.each(['RECEPTIONIST', 'MECHANIC', 'SALES', 'CASHIER'])('hides balances from %s but keeps the chart structure', async (role) => {
    const [list] = await call(controller.getAccounts, role);
    expect(list).not.toHaveProperty('balanceSYP');
    expect(list).not.toHaveProperty('balanceUSD');
    expect(list).toMatchObject({ code: '3100', nameAr: 'رأس المال' });

    const single = await call(controller.getAccountById, role);
    expect(single).not.toHaveProperty('balanceSYP');
    expect(single).toMatchObject({ code: '3100' });

    const [root] = await call(controller.getAccountTree, role);
    expect(root).not.toHaveProperty('balanceSYP');
    expect(root.children[0]).not.toHaveProperty('balanceUSD');
    expect(root.children[0]).toMatchObject({ code: '3110' });
  });
});
