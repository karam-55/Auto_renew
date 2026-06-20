import prisma from '../../config/database';
import { BalanceSheetService, BalanceSheet } from './balance-sheet.service';
import { IncomeStatementService, IncomeStatement } from './income-statement.service';

/**
 * Statement Comparison Service
 * Compares financial statements across different periods
 * 
 * Provides period-over-period analysis with variance calculations
 */

export interface Variance {
  amount: number;
  percent: number;
  isPositive: boolean;
}

export interface ComparisonMetric {
  label: string;
  labelAr?: string;
  period1Value: number;
  period2Value: number;
  variance: Variance;
}

export interface BalanceSheetComparison {
  period1: {
    start: Date;
    end: Date;
    balanceSheet: BalanceSheet;
  };
  period2: {
    start: Date;
    end: Date;
    balanceSheet: BalanceSheet;
  };
  metrics: ComparisonMetric[];
  summary: {
    totalAssetsChange: Variance;
    totalLiabilitiesChange: Variance;
    totalEquityChange: Variance;
  };
}

export interface IncomeStatementComparison {
  period1: {
    start: Date;
    end: Date;
    incomeStatement: IncomeStatement;
  };
  period2: {
    start: Date;
    end: Date;
    incomeStatement: IncomeStatement;
  };
  metrics: ComparisonMetric[];
  summary: {
    revenueChange: Variance;
    expenseChange: Variance;
    netIncomeChange: Variance;
    grossMarginChange: Variance;
    operatingMarginChange: Variance;
    netMarginChange: Variance;
  };
}

export class StatementComparisonService {
  private balanceSheetService = new BalanceSheetService();
  private incomeStatementService = new IncomeStatementService();

  /**
   * Compare balance sheets between two periods
   */
  async compareBalanceSheets(
    tenantId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
    currencyCode: string = 'SYP'
  ): Promise<BalanceSheetComparison> {
    const [bs1, bs2] = await Promise.all([
      this.balanceSheetService.generateBalanceSheet(tenantId, period1End, undefined, currencyCode),
      this.balanceSheetService.generateBalanceSheet(tenantId, period2End, undefined, currencyCode)
    ]);

    const metrics: ComparisonMetric[] = [
      {
        label: 'Total Assets',
        labelAr: 'إجمالي الأصول',
        period1Value: bs1.totalAssetsSYP,
        period2Value: bs2.totalAssetsSYP,
        variance: this.calculateVariance(bs1.totalAssetsSYP, bs2.totalAssetsSYP)
      },
      {
        label: 'Total Liabilities',
        labelAr: 'إجمالي الخصوم',
        period1Value: bs1.totalLiabilitiesSYP,
        period2Value: bs2.totalLiabilitiesSYP,
        variance: this.calculateVariance(bs1.totalLiabilitiesSYP, bs2.totalLiabilitiesSYP)
      },
      {
        label: 'Total Equity',
        labelAr: 'إجمالي حقوق الملكية',
        period1Value: bs1.totalEquitySYP,
        period2Value: bs2.totalEquitySYP,
        variance: this.calculateVariance(bs1.totalEquitySYP, bs2.totalEquitySYP)
      }
    ];

    return {
      period1: {
        start: period1Start,
        end: period1End,
        balanceSheet: bs1
      },
      period2: {
        start: period2Start,
        end: period2End,
        balanceSheet: bs2
      },
      metrics,
      summary: {
        totalAssetsChange: this.calculateVariance(bs1.totalAssetsSYP, bs2.totalAssetsSYP),
        totalLiabilitiesChange: this.calculateVariance(bs1.totalLiabilitiesSYP, bs2.totalLiabilitiesSYP),
        totalEquityChange: this.calculateVariance(bs1.totalEquitySYP, bs2.totalEquitySYP)
      }
    };
  }

  /**
   * Compare income statements between two periods
   */
  async compareIncomeStatements(
    tenantId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
    currencyCode: string = 'SYP'
  ): Promise<IncomeStatementComparison> {
    const [is1, is2] = await Promise.all([
      this.incomeStatementService.generateIncomeStatement(tenantId, period1Start, period1End, undefined, currencyCode),
      this.incomeStatementService.generateIncomeStatement(tenantId, period2Start, period2End, undefined, currencyCode)
    ]);

    const metrics: ComparisonMetric[] = [
      {
        label: 'Total Revenue',
        labelAr: 'إجمالي الإيرادات',
        period1Value: is1.totalRevenueSYP,
        period2Value: is2.totalRevenueSYP,
        variance: this.calculateVariance(is1.totalRevenueSYP, is2.totalRevenueSYP)
      },
      {
        label: 'Cost of Goods Sold',
        labelAr: 'تكلفة البضاعة المباعة',
        period1Value: is1.totalCostOfGoodsSoldSYP,
        period2Value: is2.totalCostOfGoodsSoldSYP,
        variance: this.calculateVariance(is1.totalCostOfGoodsSoldSYP, is2.totalCostOfGoodsSoldSYP)
      },
      {
        label: 'Gross Profit',
        labelAr: 'إجمالي الربح',
        period1Value: is1.grossProfitSYP,
        period2Value: is2.grossProfitSYP,
        variance: this.calculateVariance(is1.grossProfitSYP, is2.grossProfitSYP)
      },
      {
        label: 'Operating Expenses',
        labelAr: 'المصاريف التشغيلية',
        period1Value: is1.totalOperatingExpensesSYP,
        period2Value: is2.totalOperatingExpensesSYP,
        variance: this.calculateVariance(is1.totalOperatingExpensesSYP, is2.totalOperatingExpensesSYP)
      },
      {
        label: 'Operating Income',
        labelAr: 'الدخل التشغيلي',
        period1Value: is1.operatingIncomeSYP,
        period2Value: is2.operatingIncomeSYP,
        variance: this.calculateVariance(is1.operatingIncomeSYP, is2.operatingIncomeSYP)
      },
      {
        label: 'Net Income',
        labelAr: 'صافي الربح',
        period1Value: is1.netIncomeSYP,
        period2Value: is2.netIncomeSYP,
        variance: this.calculateVariance(is1.netIncomeSYP, is2.netIncomeSYP)
      }
    ];

    return {
      period1: {
        start: period1Start,
        end: period1End,
        incomeStatement: is1
      },
      period2: {
        start: period2Start,
        end: period2End,
        incomeStatement: is2
      },
      metrics,
      summary: {
        revenueChange: this.calculateVariance(is1.totalRevenueSYP, is2.totalRevenueSYP),
        expenseChange: this.calculateVariance(is1.totalOperatingExpensesSYP, is2.totalOperatingExpensesSYP),
        netIncomeChange: this.calculateVariance(is1.netIncomeSYP, is2.netIncomeSYP),
        grossMarginChange: this.calculateVariance(is1.grossProfitMarginPercent, is2.grossProfitMarginPercent),
        operatingMarginChange: this.calculateVariance(is1.operatingMarginPercent, is2.operatingMarginPercent),
        netMarginChange: this.calculateVariance(is1.netProfitMarginPercent, is2.netProfitMarginPercent)
      }
    };
  }

  /**
   * Calculate variance between two values
   */
  private calculateVariance(value1: number, value2: number): Variance {
    const amount = value2 - value1;
    const percent = value1 !== 0 ? (amount / Math.abs(value1)) * 100 : 0;
    
    return {
      amount,
      percent,
      isPositive: amount >= 0
    };
  }

  /**
   * Compare multiple periods (trend analysis)
   */
  async compareMultiplePeriods(
    tenantId: string,
    periods: Array<{ start: Date; end: Date }>,
    currencyCode: string = 'SYP'
  ): Promise<{
    balanceSheets: BalanceSheet[];
    incomeStatements: IncomeStatement[];
    trends: {
      assets: number[];
      liabilities: number[];
      equity: number[];
      revenue: number[];
      expenses: number[];
      netIncome: number[];
    };
  }> {
    const balanceSheets = await Promise.all(
      periods.map(p => 
        this.balanceSheetService.generateBalanceSheet(tenantId, p.end, undefined, currencyCode)
      )
    );

    const incomeStatements = await Promise.all(
      periods.map(p => 
        this.incomeStatementService.generateIncomeStatement(tenantId, p.start, p.end, undefined, currencyCode)
      )
    );

    const trends = {
      assets: balanceSheets.map(bs => bs.totalAssetsSYP),
      liabilities: balanceSheets.map(bs => bs.totalLiabilitiesSYP),
      equity: balanceSheets.map(bs => bs.totalEquitySYP),
      revenue: incomeStatements.map(is => is.totalRevenueSYP),
      expenses: incomeStatements.map(is => is.totalOperatingExpensesSYP),
      netIncome: incomeStatements.map(is => is.netIncomeSYP)
    };

    return {
      balanceSheets,
      incomeStatements,
      trends
    };
  }

  /**
   * Get year-over-year comparison
   */
  async getYearOverYearComparison(
    tenantId: string,
    year1: number,
    year2: number,
    currencyCode: string = 'SYP'
  ): Promise<{
    balanceSheetComparison: BalanceSheetComparison;
    incomeStatementComparison: IncomeStatementComparison;
  }> {
    const year1Start = new Date(year1, 0, 1);
    const year1End = new Date(year1, 11, 31);
    const year2Start = new Date(year2, 0, 1);
    const year2End = new Date(year2, 11, 31);

    const [balanceSheetComparison, incomeStatementComparison] = await Promise.all([
      this.compareBalanceSheets(tenantId, year1Start, year1End, year2Start, year2End, currencyCode),
      this.compareIncomeStatements(tenantId, year1Start, year1End, year2Start, year2End, currencyCode)
    ]);

    return {
      balanceSheetComparison,
      incomeStatementComparison
    };
  }

  /**
   * Get quarter-over-quarter comparison
   */
  async getQuarterOverQuarterComparison(
    tenantId: string,
    year: number,
    quarter1: number,
    quarter2: number,
    currencyCode: string = 'SYP'
  ): Promise<{
    balanceSheetComparison: BalanceSheetComparison;
    incomeStatementComparison: IncomeStatementComparison;
  }> {
    const q1Start = new Date(year, (quarter1 - 1) * 3, 1);
    const q1End = new Date(year, quarter1 * 3, 0);
    const q2Start = new Date(year, (quarter2 - 1) * 3, 1);
    const q2End = new Date(year, quarter2 * 3, 0);

    const [balanceSheetComparison, incomeStatementComparison] = await Promise.all([
      this.compareBalanceSheets(tenantId, q1Start, q1End, q2Start, q2End, currencyCode),
      this.compareIncomeStatements(tenantId, q1Start, q1End, q2Start, q2End, currencyCode)
    ]);

    return {
      balanceSheetComparison,
      incomeStatementComparison
    };
  }
}

export default new StatementComparisonService();
