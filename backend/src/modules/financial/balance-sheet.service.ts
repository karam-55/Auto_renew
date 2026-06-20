import { AccountType } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Balance Sheet Service
 * Generates balance sheet with assets, liabilities, and equity
 * 
 * Balance Sheet Equation: Assets = Liabilities + Equity
 */

export interface BalanceSheetLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  accountType: AccountType;
  amountSYP: number;
  amountUSD?: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  level: number;
}

export interface BalanceSheetSection {
  title: string;
  titleAr?: string;
  items: BalanceSheetLineItem[];
  totalSYP: number;
  totalUSD?: number;
}

export interface BalanceSheet {
  tenantId: string;
  fiscalPeriodId?: string;
  asOfDate: Date;
  currencyCode: string;
  sections: {
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
  };
  totalAssetsSYP: number;
  totalLiabilitiesSYP: number;
  totalEquitySYP: number;
  totalAssetsUSD?: number;
  totalLiabilitiesUSD?: number;
  totalEquityUSD?: number;
  generatedAt: Date;
}

export class BalanceSheetService {
  /**
   * Generate balance sheet as of a specific date
   */
  async generateBalanceSheet(
    tenantId: string,
    asOfDate: Date,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<BalanceSheet> {
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

    // Group by account type
    const assetAccounts = accountBalances.filter(
      a => a.accountType === AccountType.ASSET
    );
    const liabilityAccounts = accountBalances.filter(
      a => a.accountType === AccountType.LIABILITY
    );
    const equityAccounts = accountBalances.filter(
      a => a.accountType === AccountType.EQUITY
    );

    // Build sections
    const assets = this.buildSection('Assets', 'الأصول', assetAccounts);
    const liabilities = this.buildSection('Liabilities', 'الخصوم', liabilityAccounts);
    const equity = this.buildSection('Equity', 'حقوق الملكية', equityAccounts);

    // Calculate totals
    const totalAssetsSYP = assets.totalSYP;
    const totalLiabilitiesSYP = liabilities.totalSYP;
    const totalEquitySYP = equity.totalSYP;

    // Convert to USD if needed
    let totalAssetsUSD: number | undefined;
    let totalLiabilitiesUSD: number | undefined;
    let totalEquityUSD: number | undefined;

    if (currencyCode === 'USD') {
      const exchangeRate = await this.getExchangeRate(tenantId, asOfDate);
      if (exchangeRate) {
        totalAssetsUSD = totalAssetsSYP / exchangeRate;
        totalLiabilitiesUSD = totalLiabilitiesSYP / exchangeRate;
        totalEquityUSD = totalEquitySYP / exchangeRate;
      }
    }

    return {
      tenantId,
      fiscalPeriodId,
      asOfDate,
      currencyCode,
      sections: {
        assets,
        liabilities,
        equity
      },
      totalAssetsSYP,
      totalLiabilitiesSYP,
      totalEquitySYP,
      totalAssetsUSD,
      totalLiabilitiesUSD,
      totalEquityUSD,
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
  ): Promise<BalanceSheetLineItem[]> {
    const balances: BalanceSheetLineItem[] = [];

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
        },
        include: {
          entry: true
        }
      });

      // Calculate balance based on account type
      let balanceSYP = 0;
      let balanceUSD = 0;

      for (const line of journalLines) {
        const debitSYP = Number(line.debitSYP || 0);
        const creditSYP = Number(line.creditSYP || 0);
        const debitUSD = Number(line.debitUSD || 0);
        const creditUSD = Number(line.creditUSD || 0);

        // Assets, COGS and Expenses: Debit increases balance
        if (account.type === AccountType.ASSET || account.type === AccountType.COGS || account.type === AccountType.EXPENSE) {
          balanceSYP += debitSYP - creditSYP;
          balanceUSD += debitUSD - creditUSD;
        }
        // Liabilities, Equity, Revenue: Credit increases balance
        else {
          balanceSYP += creditSYP - debitSYP;
          balanceUSD += creditUSD - debitUSD;
        }
      }

      balances.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountNameAr: account.nameAr,
        accountType: account.type,
        amountSYP: balanceSYP,
        amountUSD: balanceUSD || undefined,
        level: 1
      });
    }

    return balances;
  }

  /**
   * Build a balance sheet section with subtotals
   */
  private buildSection(
    title: string,
    titleAr: string,
    items: BalanceSheetLineItem[]
  ): BalanceSheetSection {
    let totalSYP = 0;
    let totalUSD = 0;

    for (const item of items) {
      totalSYP += item.amountSYP;
      if (item.amountUSD) {
        totalUSD += item.amountUSD;
      }
    }

    return {
      title,
      titleAr,
      items,
      totalSYP,
      totalUSD: totalUSD || undefined
    };
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
   * Generate comparative balance sheet (period over period)
   */
  async generateComparativeBalanceSheet(
    tenantId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
    currencyCode: string = 'SYP'
  ) {
    const [balanceSheet1, balanceSheet2] = await Promise.all([
      this.generateBalanceSheet(tenantId, period1End, undefined, currencyCode),
      this.generateBalanceSheet(tenantId, period2End, undefined, currencyCode)
    ]);

    return {
      period1: {
        start: period1Start,
        end: period1End,
        balanceSheet: balanceSheet1
      },
      period2: {
        start: period2Start,
        end: period2End,
        balanceSheet: balanceSheet2
      },
      comparison: this.calculateComparison(balanceSheet1, balanceSheet2)
    };
  }

  /**
   * Calculate comparison between two balance sheets
   */
  private calculateComparison(
    bs1: BalanceSheet,
    bs2: BalanceSheet
  ) {
    return {
      assetsChange: bs2.totalAssetsSYP - bs1.totalAssetsSYP,
      assetsChangePercent: bs1.totalAssetsSYP > 0
        ? ((bs2.totalAssetsSYP - bs1.totalAssetsSYP) / bs1.totalAssetsSYP) * 100
        : 0,
      liabilitiesChange: bs2.totalLiabilitiesSYP - bs1.totalLiabilitiesSYP,
      liabilitiesChangePercent: bs1.totalLiabilitiesSYP > 0
        ? ((bs2.totalLiabilitiesSYP - bs1.totalLiabilitiesSYP) / bs1.totalLiabilitiesSYP) * 100
        : 0,
      equityChange: bs2.totalEquitySYP - bs1.totalEquitySYP,
      equityChangePercent: bs1.totalEquitySYP > 0
        ? ((bs2.totalEquitySYP - bs1.totalEquitySYP) / bs1.totalEquitySYP) * 100
        : 0
    };
  }
}

export default new BalanceSheetService();
