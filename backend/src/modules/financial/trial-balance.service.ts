import { AccountType } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Trial Balance Service
 * Generates trial balance with all account balances
 * 
 * Trial Balance lists all ledger account balances to verify that
 * total debits equal total credits
 */

export interface TrialBalanceLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  accountType: AccountType;
  debitSYP: number;
  creditSYP: number;
  debitUSD?: number;
  creditUSD?: number;
  level: number;
}

export interface TrialBalance {
  tenantId: string;
  fiscalPeriodId?: string;
  asOfDate: Date;
  currencyCode: string;
  items: TrialBalanceLineItem[];
  totalDebitSYP: number;
  totalCreditSYP: number;
  isBalanced: boolean;
  differenceSYP: number;
  totalDebitUSD?: number;
  totalCreditUSD?: number;
  differenceUSD?: number;
  generatedAt: Date;
}

export class TrialBalanceService {
  /**
   * Generate trial balance as of a specific date
   */
  async generateTrialBalance(
    tenantId: string,
    asOfDate: Date,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<TrialBalance> {
    // Get all accounts for tenant
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Calculate balances for each account
    const accountBalances = await this.calculateAccountBalances(
      tenantId,
      asOfDate,
      accounts
    );

    // Calculate totals
    let totalDebitSYP = 0;
    let totalCreditSYP = 0;

    for (const balance of accountBalances) {
      totalDebitSYP += balance.debitSYP;
      totalCreditSYP += balance.creditSYP;
    }

    const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;
    const differenceSYP = totalDebitSYP - totalCreditSYP;

    // Convert to USD if needed
    let totalDebitUSD: number | undefined;
    let totalCreditUSD: number | undefined;
    let differenceUSD: number | undefined;

    if (currencyCode === 'USD') {
      const exchangeRate = await this.getExchangeRate(tenantId, asOfDate);
      if (exchangeRate) {
        totalDebitUSD = totalDebitSYP / exchangeRate;
        totalCreditUSD = totalCreditSYP / exchangeRate;
        differenceUSD = differenceSYP / exchangeRate;
      }
    }

    return {
      tenantId,
      fiscalPeriodId,
      asOfDate,
      currencyCode,
      items: accountBalances,
      totalDebitSYP,
      totalCreditSYP,
      isBalanced,
      differenceSYP,
      totalDebitUSD,
      totalCreditUSD,
      differenceUSD,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate balances for all accounts as of a date
   */
  private async calculateAccountBalances(
    tenantId: string,
    asOfDate: Date,
    accounts: any[]
  ): Promise<TrialBalanceLineItem[]> {
    const balances: TrialBalanceLineItem[] = [];

    for (const account of accounts) {
      // Get journal lines for this account up to asOfDate
      const journalLines = await prisma.journalLine.findMany({
        where: {
          entry: {
            tenantId,
            entryDate: {
              lte: asOfDate
            },
            status: 'POSTED'
          },
          accountId: account.id
        }
      });

      // Calculate debit and credit totals
      let debitSYP = 0;
      let creditSYP = 0;
      let debitUSD = 0;
      let creditUSD = 0;

      for (const line of journalLines) {
        debitSYP += Number(line.debitSYP || 0);
        creditSYP += Number(line.creditSYP || 0);
        debitUSD += Number(line.debitUSD || 0);
        creditUSD += Number(line.creditUSD || 0);
      }

      // Calculate net balance based on account type
      // Assets, COGS, Expenses: Debit balance
      // Liabilities, Equity, Revenue: Credit balance
      let netDebitSYP = 0;
      let netCreditSYP = 0;
      let netDebitUSD = 0;
      let netCreditUSD = 0;

      if (account.accountType === AccountType.ASSET || account.accountType === AccountType.COGS || account.accountType === AccountType.EXPENSE) {
        const netSYP = debitSYP - creditSYP;
        const netUSD = debitUSD - creditUSD;
        if (netSYP >= 0) {
          netDebitSYP = netSYP;
          netDebitUSD = netUSD;
        } else {
          netCreditSYP = Math.abs(netSYP);
          netCreditUSD = Math.abs(netUSD);
        }
      } else {
        const netSYP = creditSYP - debitSYP;
        const netUSD = creditUSD - debitUSD;
        if (netSYP >= 0) {
          netCreditSYP = netSYP;
          netCreditUSD = netUSD;
        } else {
          netDebitSYP = Math.abs(netSYP);
          netDebitUSD = Math.abs(netUSD);
        }
      }

      balances.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        debitSYP: netDebitSYP,
        creditSYP: netCreditSYP,
        debitUSD: netDebitUSD || undefined,
        creditUSD: netCreditUSD || undefined,
        level: 1
      });
    }

    return balances;
  }

  /**
   * Get exchange rate for a specific date
   */
  private async getExchangeRate(
    tenantId: string,
    date: Date
  ): Promise<number | null> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        effectiveDate: {
          lte: date
        },
        isActive: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    return exchangeRate ? Number(exchangeRate.rate) : null;
  }

  /**
   * Generate trial balance for a specific period
   */
  async generatePeriodTrialBalance(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<TrialBalance> {
    // Get all accounts for tenant
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Calculate balances for the period
    const accountBalances = await this.calculatePeriodBalances(
      tenantId,
      periodStart,
      periodEnd,
      accounts
    );

    // Calculate totals
    let totalDebitSYP = 0;
    let totalCreditSYP = 0;

    for (const balance of accountBalances) {
      totalDebitSYP += balance.debitSYP;
      totalCreditSYP += balance.creditSYP;
    }

    const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;
    const differenceSYP = totalDebitSYP - totalCreditSYP;

    // Convert to USD if needed
    let totalDebitUSD: number | undefined;
    let totalCreditUSD: number | undefined;
    let differenceUSD: number | undefined;

    if (currencyCode === 'USD') {
      const exchangeRate = await this.getExchangeRate(tenantId, periodEnd);
      if (exchangeRate) {
        totalDebitUSD = totalDebitSYP / exchangeRate;
        totalCreditUSD = totalCreditSYP / exchangeRate;
        differenceUSD = differenceSYP / exchangeRate;
      }
    }

    return {
      tenantId,
      fiscalPeriodId,
      asOfDate: periodEnd,
      currencyCode,
      items: accountBalances,
      totalDebitSYP,
      totalCreditSYP,
      isBalanced,
      differenceSYP,
      totalDebitUSD,
      totalCreditUSD,
      differenceUSD,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate account balances for a specific period
   */
  private async calculatePeriodBalances(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    accounts: any[]
  ): Promise<TrialBalanceLineItem[]> {
    const balances: TrialBalanceLineItem[] = [];

    for (const account of accounts) {
      // Get journal lines for this account within the period
      const journalLines = await prisma.journalLine.findMany({
        where: {
          entry: {
            tenantId,
            entryDate: {
              gte: periodStart,
              lte: periodEnd
            },
            status: 'POSTED'
          },
          accountId: account.id
        }
      });

      // Calculate debit and credit totals
      let debitSYP = 0;
      let creditSYP = 0;
      let debitUSD = 0;
      let creditUSD = 0;

      for (const line of journalLines) {
        debitSYP += Number(line.debitSYP || 0);
        creditSYP += Number(line.creditSYP || 0);
        debitUSD += Number(line.debitUSD || 0);
        creditUSD += Number(line.creditUSD || 0);
      }

      // For period trial balance, show actual debits and credits
      balances.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        debitSYP,
        creditSYP,
        debitUSD: debitUSD || undefined,
        creditUSD: creditUSD || undefined,
        level: 1
      });
    }

    return balances;
  }

  /**
   * Generate adjusted trial balance (with adjustments)
   */
  async generateAdjustedTrialBalance(
    tenantId: string,
    asOfDate: Date,
    adjustments: Array<{ accountId: string; debitSYP: number; creditSYP: number }>,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<TrialBalance> {
    // Get base trial balance
    const baseTrialBalance = await this.generateTrialBalance(
      tenantId,
      asOfDate,
      fiscalPeriodId,
      currencyCode
    );

    // Apply adjustments
    const adjustedItems = baseTrialBalance.items.map(item => {
      const adjustment = adjustments.find(a => a.accountId === item.accountId);
      if (adjustment) {
        return {
          ...item,
          debitSYP: item.debitSYP + adjustment.debitSYP,
          creditSYP: item.creditSYP + adjustment.creditSYP
        };
      }
      return item;
    });

    // Recalculate totals
    let totalDebitSYP = 0;
    let totalCreditSYP = 0;

    for (const item of adjustedItems) {
      totalDebitSYP += item.debitSYP;
      totalCreditSYP += item.creditSYP;
    }

    const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;
    const differenceSYP = totalDebitSYP - totalCreditSYP;

    return {
      ...baseTrialBalance,
      items: adjustedItems,
      totalDebitSYP,
      totalCreditSYP,
      isBalanced,
      differenceSYP
    };
  }
}

export default new TrialBalanceService();
