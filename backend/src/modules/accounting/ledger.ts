import { AccountType, JournalEntryStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';

export type LedgerCurrency = 'SYP' | 'USD';
export type BalanceAdjustmentMode = 'ADD' | 'SUBTRACT' | 'SET';

export interface LedgerAccount {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: AccountType;
}

export interface LedgerTotals {
  debitSYP: number;
  creditSYP: number;
  debitUSD: number;
  creditUSD: number;
}

export type LedgerTotalsMap = Map<string, LedgerTotals>;

export interface LedgerLine {
  accountId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: AccountType;
  amount: number;
}

export interface LedgerBalanceSheet {
  currency: LedgerCurrency;
  assets: LedgerLine[];
  liabilities: LedgerLine[];
  equity: LedgerLine[];
  currentPeriodResult: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  difference: number;
  isBalanced: boolean;
}

export interface LedgerIncomeStatement {
  currency: LedgerCurrency;
  revenue: LedgerLine[];
  cogs: LedgerLine[];
  expenses: LedgerLine[];
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalExpenses: number;
  netIncome: number;
  netMargin: number;
}

export interface LedgerTrialBalanceRow {
  accountId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  grossDebit: number;
  grossCredit: number;
}

export interface LedgerTrialBalance {
  currency: LedgerCurrency;
  rows: LedgerTrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

// Debit increases balance for: ASSET, EXPENSE, COGS
// Credit increases balance for: LIABILITY, EQUITY, REVENUE
// Balance depends on account type per GAAP:
// ASSET, EXPENSE: normal debit balance = debit - credit
// LIABILITY, EQUITY, REVENUE: normal credit balance = credit - debit
const DEBIT_NORMAL_TYPES: AccountType[] = [AccountType.ASSET, AccountType.COGS, AccountType.EXPENSE];
const BALANCE_TOLERANCE = 0.01;

export const round2 = (value: number): number => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded === 0 ? 0 : rounded;
};

export const zeroTotals = (): LedgerTotals => ({ debitSYP: 0, creditSYP: 0, debitUSD: 0, creditUSD: 0 });

export const isDebitNormal = (accountType: AccountType): boolean => DEBIT_NORMAL_TYPES.includes(accountType);

export const debitMinusCredit = (totals: LedgerTotals, currency: LedgerCurrency): number =>
  currency === 'USD'
    ? round2(totals.debitUSD - totals.creditUSD)
    : round2(totals.debitSYP - totals.creditSYP);

export const naturalBalance = (accountType: AccountType, debitMinusCreditAmount: number): number =>
  isDebitNormal(accountType) ? round2(debitMinusCreditAmount) : round2(-debitMinusCreditAmount);

export const balanceOf = (account: LedgerAccount, totals: LedgerTotalsMap, currency: LedgerCurrency): number =>
  naturalBalance(account.accountType, debitMinusCredit(totals.get(account.id) || zeroTotals(), currency));

export const accountBalances = (account: LedgerAccount, totals: LedgerTotalsMap) => {
  const total = totals.get(account.id) || zeroTotals();
  return {
    debitSYP: round2(total.debitSYP),
    creditSYP: round2(total.creditSYP),
    debitUSD: round2(total.debitUSD),
    creditUSD: round2(total.creditUSD),
    balanceSYP: naturalBalance(account.accountType, debitMinusCredit(total, 'SYP')),
    balanceUSD: naturalBalance(account.accountType, debitMinusCredit(total, 'USD')),
  };
};

const sum = (values: number[]): number => round2(values.reduce((total, value) => total + value, 0));

const toLine = (account: LedgerAccount, amount: number): LedgerLine => ({
  accountId: account.id,
  code: account.code,
  nameAr: account.nameAr,
  nameEn: account.nameEn,
  accountType: account.accountType,
  amount,
});

const linesOfType = (accounts: LedgerAccount[], totals: LedgerTotalsMap, currency: LedgerCurrency, type: AccountType): LedgerLine[] =>
  accounts
    .filter((account) => account.accountType === type)
    .map((account) => toLine(account, balanceOf(account, totals, currency)))
    .filter((line) => line.amount !== 0);

const unclassifiedDifference = (totals: LedgerTotalsMap, currency: LedgerCurrency): number =>
  sum(Array.from(totals.values(), (total) => debitMinusCredit(total, currency)));

export async function loadLedgerTotals(
  tenantId: string,
  range: { from?: Date; to?: Date } = {},
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<LedgerTotalsMap> {
  const rows = await client.journalLine.groupBy({
    by: ['accountId'],
    where: {
      deletedAt: null,
      entry: {
        tenantId,
        status: JournalEntryStatus.POSTED,
        deletedAt: null,
        entryDate: { gte: range.from, lte: range.to },
      },
    },
    _sum: { debitSYP: true, creditSYP: true, debitUSD: true, creditUSD: true },
  });

  const totals: LedgerTotalsMap = new Map();
  for (const row of rows) {
    totals.set(row.accountId, {
      debitSYP: Number(row._sum.debitSYP || 0),
      creditSYP: Number(row._sum.creditSYP || 0),
      debitUSD: Number(row._sum.debitUSD || 0),
      creditUSD: Number(row._sum.creditUSD || 0),
    });
  }
  return totals;
}

export function buildBalanceSheet(
  accounts: LedgerAccount[],
  totals: LedgerTotalsMap,
  currency: LedgerCurrency,
): LedgerBalanceSheet {
  const assets = linesOfType(accounts, totals, currency, AccountType.ASSET);
  const liabilities = linesOfType(accounts, totals, currency, AccountType.LIABILITY);
  const equity = linesOfType(accounts, totals, currency, AccountType.EQUITY);

  // Calculate Retained Earnings = cumulative Revenue - cumulative Expenses up to asOfDate
  const currentPeriodResult = sum(accounts.map((account) => {
    const amount = balanceOf(account, totals, currency);
    if (account.accountType === AccountType.REVENUE) return amount;
    if (account.accountType === AccountType.COGS || account.accountType === AccountType.EXPENSE) return -amount;
    return 0;
  }));

  const totalAssets = sum(assets.map((line) => line.amount));
  const totalLiabilities = sum(liabilities.map((line) => line.amount));
  const totalEquity = round2(sum(equity.map((line) => line.amount)) + currentPeriodResult);
  const totalLiabilitiesAndEquity = round2(totalLiabilities + totalEquity);
  const difference = round2(totalAssets - totalLiabilitiesAndEquity);

  return {
    currency,
    assets,
    liabilities,
    equity,
    currentPeriodResult,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity,
    difference,
    isBalanced: Math.abs(difference) < BALANCE_TOLERANCE && Math.abs(unclassifiedDifference(totals, currency)) < BALANCE_TOLERANCE,
  };
}

export function buildIncomeStatement(
  accounts: LedgerAccount[],
  totals: LedgerTotalsMap,
  currency: LedgerCurrency,
): LedgerIncomeStatement {
  // Revenue: credit increases, debit decreases (contra-revenue)
  const revenue = linesOfType(accounts, totals, currency, AccountType.REVENUE);
  // COGS & Expense: debit increases, credit decreases
  const cogs = linesOfType(accounts, totals, currency, AccountType.COGS);
  const expenses = linesOfType(accounts, totals, currency, AccountType.EXPENSE);

  const totalRevenue = sum(revenue.map((line) => line.amount));
  const totalCogs = sum(cogs.map((line) => line.amount));
  const totalExpenses = sum(expenses.map((line) => line.amount));
  const grossProfit = round2(totalRevenue - totalCogs);
  const netIncome = round2(grossProfit - totalExpenses);

  return {
    currency,
    revenue,
    cogs,
    expenses,
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netIncome,
    netMargin: totalRevenue > 0 ? round2((netIncome / totalRevenue) * 100) : 0,
  };
}

export function buildTrialBalance(
  accounts: LedgerAccount[],
  totals: LedgerTotalsMap,
  currency: LedgerCurrency,
): LedgerTrialBalance {
  const rows = accounts
    .map((account) => {
      const total = totals.get(account.id) || zeroTotals();
      const amount = debitMinusCredit(total, currency);
      return {
        accountId: account.id,
        code: account.code,
        nameAr: account.nameAr,
        nameEn: account.nameEn,
        accountType: account.accountType,
        debit: amount > 0 ? amount : 0,
        credit: amount < 0 ? round2(-amount) : 0,
        grossDebit: currency === 'USD' ? round2(total.debitUSD) : round2(total.debitSYP),
        grossCredit: currency === 'USD' ? round2(total.creditUSD) : round2(total.creditSYP),
      };
    })
    .filter((row) => row.grossDebit !== 0 || row.grossCredit !== 0);

  const postings = Array.from(totals.values());
  const totalDebit = sum(postings.map((total) => (currency === 'USD' ? total.debitUSD : total.debitSYP)));
  const totalCredit = sum(postings.map((total) => (currency === 'USD' ? total.creditUSD : total.creditSYP)));
  const difference = round2(totalDebit - totalCredit);

  return {
    currency,
    rows,
    totalDebit,
    totalCredit,
    difference,
    isBalanced: Math.abs(difference) < BALANCE_TOLERANCE,
  };
}

export function planBalanceAdjustment(
  accountType: AccountType,
  currentNatural: number,
  mode: BalanceAdjustmentMode,
  amount: number,
): { amount: number; accountSide: 'DEBIT' | 'CREDIT' } {
  const deltaNatural = mode === 'SET'
    ? round2(amount - currentNatural)
    : round2(mode === 'SUBTRACT' ? -amount : amount);
  if (Math.abs(deltaNatural) < BALANCE_TOLERANCE) {
    throw new Error('Requested balance equals the current balance; nothing to adjust');
  }
  const debitMinusCreditDelta = isDebitNormal(accountType) ? deltaNatural : round2(-deltaNatural);
  return {
    amount: round2(Math.abs(debitMinusCreditDelta)),
    accountSide: debitMinusCreditDelta > 0 ? 'DEBIT' : 'CREDIT',
  };
}
