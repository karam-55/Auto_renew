import { AccountType } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Income Statement Service
 * Generates income statement with revenues, expenses, and net income
 * 
 * Income Statement Equation: Revenue - Expenses = Net Income
 */

export interface IncomeStatementLineItem {
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

export interface IncomeStatementSection {
  title: string;
  titleAr?: string;
  items: IncomeStatementLineItem[];
  totalSYP: number;
  totalUSD?: number;
}

export interface IncomeStatement {
  tenantId: string;
  fiscalPeriodId?: string;
  periodStart: Date;
  periodEnd: Date;
  currencyCode: string;
  sections: {
    revenue: IncomeStatementSection;
    costOfGoodsSold: IncomeStatementSection;
    grossProfit: IncomeStatementSection;
    operatingExpenses: IncomeStatementSection;
    operatingIncome: IncomeStatementSection;
    otherIncome: IncomeStatementSection;
    otherExpenses: IncomeStatementSection;
    netIncome: IncomeStatementSection;
  };
  totalRevenueSYP: number;
  totalCostOfGoodsSoldSYP: number;
  grossProfitSYP: number;
  totalOperatingExpensesSYP: number;
  operatingIncomeSYP: number;
  netIncomeSYP: number;
  grossProfitMarginPercent: number;
  operatingMarginPercent: number;
  netProfitMarginPercent: number;
  totalRevenueUSD?: number;
  totalCostOfGoodsSoldUSD?: number;
  grossProfitUSD?: number;
  totalOperatingExpensesUSD?: number;
  operatingIncomeUSD?: number;
  netIncomeUSD?: number;
  generatedAt: Date;
}

export class IncomeStatementService {
  /**
   * Generate income statement for a period
   */
  async generateIncomeStatement(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<IncomeStatement> {
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

    // Group by account type
    const revenueAccounts = accountBalances.filter(
      a => a.accountType === AccountType.REVENUE
    );
    const cogsAccounts = accountBalances.filter(
      a => a.accountType === AccountType.COGS
    );
    const operatingExpenseAccounts = accountBalances.filter(
      a => a.accountType === AccountType.EXPENSE
    );

    // Build sections
    const revenue = this.buildSection('Revenue', 'الإيرادات', revenueAccounts);
    const costOfGoodsSold = this.buildSection('Cost of Goods Sold', 'تكلفة البضاعة المباعة', cogsAccounts);
    const operatingExpenses = this.buildSection('Operating Expenses', 'المصاريف التشغيلية', operatingExpenseAccounts);

    // Calculate totals
    const totalRevenueSYP = revenue.totalSYP;
    const totalCostOfGoodsSoldSYP = costOfGoodsSold.totalSYP;
    const grossProfitSYP = totalRevenueSYP - totalCostOfGoodsSoldSYP;
    const totalOperatingExpensesSYP = operatingExpenses.totalSYP;
    const operatingIncomeSYP = grossProfitSYP - totalOperatingExpensesSYP;
    const netIncomeSYP = operatingIncomeSYP; // Assuming no other income/expenses for now

    // Calculate margins
    const grossProfitMarginPercent = totalRevenueSYP > 0
      ? (grossProfitSYP / totalRevenueSYP) * 100
      : 0;
    const operatingMarginPercent = totalRevenueSYP > 0
      ? (operatingIncomeSYP / totalRevenueSYP) * 100
      : 0;
    const netProfitMarginPercent = totalRevenueSYP > 0
      ? (netIncomeSYP / totalRevenueSYP) * 100
      : 0;

    // Convert to USD if needed
    let totalRevenueUSD: number | undefined;
    let totalCostOfGoodsSoldUSD: number | undefined;
    let grossProfitUSD: number | undefined;
    let totalOperatingExpensesUSD: number | undefined;
    let operatingIncomeUSD: number | undefined;
    let netIncomeUSD: number | undefined;

    if (currencyCode === 'USD') {
      const exchangeRate = await this.getExchangeRate(tenantId, periodEnd);
      if (exchangeRate) {
        totalRevenueUSD = totalRevenueSYP / exchangeRate;
        totalCostOfGoodsSoldUSD = totalCostOfGoodsSoldSYP / exchangeRate;
        grossProfitUSD = grossProfitSYP / exchangeRate;
        totalOperatingExpensesUSD = totalOperatingExpensesSYP / exchangeRate;
        operatingIncomeUSD = operatingIncomeSYP / exchangeRate;
        netIncomeUSD = netIncomeSYP / exchangeRate;
      }
    }

    return {
      tenantId,
      fiscalPeriodId,
      periodStart,
      periodEnd,
      currencyCode,
      sections: {
        revenue,
        costOfGoodsSold,
        grossProfit: this.buildSection('Gross Profit', 'إجمالي الربح', [{
          accountId: 'gross_profit',
          accountCode: '',
          accountName: 'Gross Profit',
          accountNameAr: 'إجمالي الربح',
          accountType: AccountType.REVENUE,
          amountSYP: grossProfitSYP,
          amountUSD: grossProfitUSD,
          level: 1
        }]),
        operatingExpenses,
        operatingIncome: this.buildSection('Operating Income', 'الدخل التشغيلي', [{
          accountId: 'operating_income',
          accountCode: '',
          accountName: 'Operating Income',
          accountNameAr: 'الدخل التشغيلي',
          accountType: AccountType.REVENUE,
          amountSYP: operatingIncomeSYP,
          amountUSD: operatingIncomeUSD,
          level: 1
        }]),
        otherIncome: this.buildSection('Other Income', 'إيرادات أخرى', []),
        otherExpenses: this.buildSection('Other Expenses', 'مصاريف أخرى', []),
        netIncome: this.buildSection('Net Income', 'صافي الربح', [{
          accountId: 'net_income',
          accountCode: '',
          accountName: 'Net Income',
          accountNameAr: 'صافي الربح',
          accountType: AccountType.REVENUE,
          amountSYP: netIncomeSYP,
          amountUSD: netIncomeUSD,
          level: 1
        }])
      },
      totalRevenueSYP,
      totalCostOfGoodsSoldSYP,
      grossProfitSYP,
      totalOperatingExpensesSYP,
      operatingIncomeSYP,
      netIncomeSYP,
      grossProfitMarginPercent,
      operatingMarginPercent,
      netProfitMarginPercent,
      totalRevenueUSD,
      totalCostOfGoodsSoldUSD,
      grossProfitUSD,
      totalOperatingExpensesUSD,
      operatingIncomeUSD,
      netIncomeUSD,
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
  ): Promise<IncomeStatementLineItem[]> {
    const balances: IncomeStatementLineItem[] = [];

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

        // Revenue: Credit increases balance
        if (account.type === AccountType.REVENUE) {
          balanceSYP += creditSYP - debitSYP;
          balanceUSD += creditUSD - debitUSD;
        }
        // COGS & Expenses: Debit increases balance
        else if (account.type === AccountType.COGS || account.type === AccountType.EXPENSE) {
          balanceSYP += debitSYP - creditSYP;
          balanceUSD += debitUSD - creditUSD;
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
   * Build an income statement section
   */
  private buildSection(
    title: string,
    titleAr: string,
    items: IncomeStatementLineItem[]
  ): IncomeStatementSection {
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
   * Generate comparative income statement (period over period)
   */
  async generateComparativeIncomeStatement(
    tenantId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
    currencyCode: string = 'SYP'
  ) {
    const [incomeStatement1, incomeStatement2] = await Promise.all([
      this.generateIncomeStatement(tenantId, period1Start, period1End, undefined, currencyCode),
      this.generateIncomeStatement(tenantId, period2Start, period2End, undefined, currencyCode)
    ]);

    return {
      period1: {
        start: period1Start,
        end: period1End,
        incomeStatement: incomeStatement1
      },
      period2: {
        start: period2Start,
        end: period2End,
        incomeStatement: incomeStatement2
      },
      comparison: this.calculateComparison(incomeStatement1, incomeStatement2)
    };
  }

  /**
   * Calculate comparison between two income statements
   */
  private calculateComparison(
    is1: IncomeStatement,
    is2: IncomeStatement
  ) {
    return {
      revenueChange: is2.totalRevenueSYP - is1.totalRevenueSYP,
      revenueChangePercent: is1.totalRevenueSYP > 0
        ? ((is2.totalRevenueSYP - is1.totalRevenueSYP) / is1.totalRevenueSYP) * 100
        : 0,
      expenseChange: is2.totalOperatingExpensesSYP - is1.totalOperatingExpensesSYP,
      expenseChangePercent: is1.totalOperatingExpensesSYP > 0
        ? ((is2.totalOperatingExpensesSYP - is1.totalOperatingExpensesSYP) / is1.totalOperatingExpensesSYP) * 100
        : 0,
      netIncomeChange: is2.netIncomeSYP - is1.netIncomeSYP,
      netIncomeChangePercent: is1.netIncomeSYP > 0
        ? ((is2.netIncomeSYP - is1.netIncomeSYP) / is1.netIncomeSYP) * 100
        : 0,
      grossMarginChange: is2.grossProfitMarginPercent - is1.grossProfitMarginPercent,
      operatingMarginChange: is2.operatingMarginPercent - is1.operatingMarginPercent,
      netMarginChange: is2.netProfitMarginPercent - is1.netProfitMarginPercent
    };
  }
}

export default new IncomeStatementService();
