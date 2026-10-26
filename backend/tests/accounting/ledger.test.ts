import { AccountType } from '@prisma/client';
import {
  buildBalanceSheet,
  buildIncomeStatement,
  buildTrialBalance,
  LedgerAccount,
  LedgerTotals,
  LedgerTotalsMap,
  naturalBalance,
  planBalanceAdjustment,
} from '../../src/modules/accounting/ledger';

jest.mock('../../src/config/database', () => ({ __esModule: true, default: {} }));

const account = (id: string, code: string, accountType: AccountType): LedgerAccount => ({
  id,
  code,
  nameAr: id,
  nameEn: id,
  accountType,
});

const totalsOf = (rows: Record<string, Partial<LedgerTotals>>): LedgerTotalsMap =>
  new Map(
    Object.entries(rows).map(([id, row]) => [
      id,
      { debitSYP: 0, creditSYP: 0, debitUSD: 0, creditUSD: 0, ...row },
    ]),
  );

const accounts: LedgerAccount[] = [
  account('cash', '1110', AccountType.ASSET),
  account('inventory', '1300', AccountType.ASSET),
  account('accDep', '1590', AccountType.ASSET),
  account('payable', '2110', AccountType.LIABILITY),
  account('capital', '3100', AccountType.EQUITY),
  account('sales', '4200', AccountType.REVENUE),
  account('salesDiscount', '4190', AccountType.REVENUE),
  account('cogs', '5100', AccountType.COGS),
  account('expense', '6500', AccountType.EXPENSE),
];

const scenarioSYP = totalsOf({
  cash: { debitSYP: 1500, creditSYP: 75 },
  inventory: { debitSYP: 300, creditSYP: 200 },
  accDep: { creditSYP: 40 },
  payable: { creditSYP: 300 },
  capital: { creditSYP: 1000 },
  sales: { creditSYP: 500 },
  salesDiscount: { debitSYP: 25 },
  cogs: { debitSYP: 200 },
  expense: { debitSYP: 90 },
});

describe('ledger balances', () => {
  it('builds a balanced SYP balance sheet with cumulative result in equity', () => {
    const bs = buildBalanceSheet(accounts, scenarioSYP, 'SYP');

    expect(bs.totalAssets).toBe(1485);
    expect(bs.totalLiabilities).toBe(300);
    expect(bs.currentPeriodResult).toBe(185);
    expect(bs.totalEquity).toBe(1185);
    expect(bs.totalLiabilitiesAndEquity).toBe(1485);
    expect(bs.difference).toBe(0);
    expect(bs.isBalanced).toBe(true);
    expect(bs.assets.find((line) => line.accountId === 'accDep')?.amount).toBe(-40);
  });

  it('keeps USD books separate from SYP books', () => {
    const usd = totalsOf({
      cash: { debitUSD: 10 },
      capital: { creditUSD: 10 },
    });
    const bs = buildBalanceSheet(accounts, usd, 'USD');
    const syp = buildBalanceSheet(accounts, usd, 'SYP');

    expect(bs.totalAssets).toBe(10);
    expect(bs.totalEquity).toBe(10);
    expect(bs.isBalanced).toBe(true);
    expect(syp.totalAssets).toBe(0);
    expect(syp.isBalanced).toBe(true);
  });

  it('flags the statement as unbalanced when a posting targets an account outside the chart', () => {
    const totals = totalsOf({
      cash: { debitSYP: 100 },
      capital: { creditSYP: 100 },
      ghost: { debitSYP: 10 },
    });
    const bs = buildBalanceSheet(accounts, totals, 'SYP');

    expect(bs.difference).toBe(0);
    expect(bs.isBalanced).toBe(false);
  });

  it('computes income statement with contra revenue, COGS and expenses', () => {
    const pl = buildIncomeStatement(accounts, scenarioSYP, 'SYP');

    expect(pl.totalRevenue).toBe(475);
    expect(pl.totalCogs).toBe(200);
    expect(pl.grossProfit).toBe(275);
    expect(pl.totalExpenses).toBe(90);
    expect(pl.netIncome).toBe(185);
    expect(pl.netMargin).toBe(38.95);
  });

  it('produces a trial balance whose debit and credit totals agree', () => {
    const tb = buildTrialBalance(accounts, scenarioSYP, 'SYP');
    const accDep = tb.rows.find((row) => row.accountId === 'accDep');
    const discount = tb.rows.find((row) => row.accountId === 'salesDiscount');

    expect(tb.totalDebit).toBe(2115);
    expect(tb.totalCredit).toBe(2115);
    expect(tb.isBalanced).toBe(true);
    expect(accDep).toEqual(expect.objectContaining({ debit: 0, credit: 40 }));
    expect(discount).toEqual(expect.objectContaining({ debit: 25, credit: 0 }));
  });

  it('uses natural sides per account type', () => {
    expect(naturalBalance(AccountType.LIABILITY, -300)).toBe(300);
    expect(naturalBalance(AccountType.ASSET, -40)).toBe(-40);
    expect(naturalBalance(AccountType.REVENUE, -475)).toBe(475);
    expect(naturalBalance(AccountType.EXPENSE, 90)).toBe(90);
  });
});

describe('balance adjustment planning', () => {
  it('debits an asset when adding to it', () => {
    expect(planBalanceAdjustment(AccountType.ASSET, 0, 'ADD', 100)).toEqual({ amount: 100, accountSide: 'DEBIT' });
  });

  it('credits an asset when subtracting from it', () => {
    expect(planBalanceAdjustment(AccountType.ASSET, 500, 'SUBTRACT', 30)).toEqual({ amount: 30, accountSide: 'CREDIT' });
  });

  it('moves an asset to a target value through the difference only', () => {
    expect(planBalanceAdjustment(AccountType.ASSET, 500, 'SET', 200)).toEqual({ amount: 300, accountSide: 'CREDIT' });
  });

  it('reduces a liability by debiting it', () => {
    expect(planBalanceAdjustment(AccountType.LIABILITY, 300, 'SET', 0)).toEqual({ amount: 300, accountSide: 'DEBIT' });
  });

  it('increases a liability by crediting it', () => {
    expect(planBalanceAdjustment(AccountType.LIABILITY, 0, 'ADD', 50)).toEqual({ amount: 50, accountSide: 'CREDIT' });
  });

  it('credits revenue when raising it and debits the offset accordingly', () => {
    expect(planBalanceAdjustment(AccountType.REVENUE, 475, 'SET', 500)).toEqual({ amount: 25, accountSide: 'CREDIT' });
  });

  it('rejects a no-op adjustment', () => {
    expect(() => planBalanceAdjustment(AccountType.ASSET, 500, 'SET', 500)).toThrow('nothing to adjust');
  });
});
