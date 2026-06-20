import prisma from '../../config/database';
import { BudgetService, Budget, BudgetLine } from './budget.service';

/**
 * Budget vs Actual Analysis Service
 * Compares budgeted amounts with actual spending
 * 
 * Provides variance analysis and alerts for budget overruns
 */

export interface BudgetAnalysis {
  budgetId: string;
  budgetName: string;
  periodStart: Date;
  periodEnd: Date;
  totalBudgetedSYP: number;
  totalActualSYP: number;
  totalVarianceSYP: number;
  variancePercent: number;
  lines: BudgetLineAnalysis[];
  alerts: BudgetAlert[];
  generatedAt: Date;
}

export interface BudgetLineAnalysis {
  accountId: string;
  accountCode: string;
  accountName: string;
  budgetedAmountSYP: number;
  actualAmountSYP: number;
  varianceSYP: number;
  variancePercent: number;
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET';
  remainingBudgetSYP: number;
  percentOfBudgetUsed: number;
}

export interface BudgetAlert {
  type: 'INFO' | 'WARNING' | 'CRITICAL';
  accountId: string;
  accountName: string;
  message: string;
  thresholdPercent: number;
  actualPercent: number;
}

export class BudgetAnalysisService {
  private budgetService = new BudgetService();

  /**
   * Analyze budget vs actual for a specific budget
   */
  async analyzeBudget(budgetId: string): Promise<BudgetAnalysis> {
    const budget = await this.budgetService.getBudget(budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Analyze each budget line
    const lines = await Promise.all(
      budget.lines.map(async (line) => {
        return await this.analyzeBudgetLine(line, budget.startDate, budget.endDate);
      })
    );

    // Calculate totals
    const totalBudgetedSYP = lines.reduce((sum, line) => sum + line.budgetedAmountSYP, 0);
    const totalActualSYP = lines.reduce((sum, line) => sum + line.actualAmountSYP, 0);
    const totalVarianceSYP = totalActualSYP - totalBudgetedSYP;
    const variancePercent = totalBudgetedSYP > 0
      ? (totalVarianceSYP / totalBudgetedSYP) * 100
      : 0;

    // Generate alerts
    const alerts = this.generateAlerts(lines);

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      periodStart: budget.startDate,
      periodEnd: budget.endDate,
      totalBudgetedSYP,
      totalActualSYP,
      totalVarianceSYP,
      variancePercent,
      lines,
      alerts,
      generatedAt: new Date()
    };
  }

  /**
   * Analyze a single budget line
   */
  private async analyzeBudgetLine(
    line: BudgetLine,
    startDate: Date,
    endDate: Date
  ): Promise<BudgetLineAnalysis> {
    const varianceSYP = line.actualAmountSYP - line.budgetedAmountSYP;
    const variancePercent = line.budgetedAmountSYP > 0
      ? (varianceSYP / line.budgetedAmountSYP) * 100
      : 0;
    const remainingBudgetSYP = line.budgetedAmountSYP - line.actualAmountSYP;
    const percentOfBudgetUsed = line.budgetedAmountSYP > 0
      ? (line.actualAmountSYP / line.budgetedAmountSYP) * 100
      : 0;

    // Determine status
    let status: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET';
    if (variancePercent > 10) {
      status = 'OVER_BUDGET';
    } else if (variancePercent < -10) {
      status = 'UNDER_BUDGET';
    } else {
      status = 'ON_TRACK';
    }

    return {
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      budgetedAmountSYP: line.budgetedAmountSYP,
      actualAmountSYP: line.actualAmountSYP,
      varianceSYP,
      variancePercent,
      status,
      remainingBudgetSYP,
      percentOfBudgetUsed
    };
  }

  /**
   * Generate budget alerts based on thresholds
   */
  private generateAlerts(lines: BudgetLineAnalysis[]): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    for (const line of lines) {
      // Critical alert: over budget by more than 20%
      if (line.variancePercent > 20) {
        alerts.push({
          type: 'CRITICAL',
          accountId: line.accountId,
          accountName: line.accountName,
          message: `Over budget by ${line.variancePercent.toFixed(1)}%`,
          thresholdPercent: 20,
          actualPercent: line.variancePercent
        });
      }
      // Warning alert: over budget by more than 10%
      else if (line.variancePercent > 10) {
        alerts.push({
          type: 'WARNING',
          accountId: line.accountId,
          accountName: line.accountName,
          message: `Over budget by ${line.variancePercent.toFixed(1)}%`,
          thresholdPercent: 10,
          actualPercent: line.variancePercent
        });
      }
      // Info alert: approaching budget limit (90% used)
      else if (line.percentOfBudgetUsed > 90 && line.percentOfBudgetUsed < 100) {
        alerts.push({
          type: 'INFO',
          accountId: line.accountId,
          accountName: line.accountName,
          message: `${line.percentOfBudgetUsed.toFixed(1)}% of budget used`,
          thresholdPercent: 90,
          actualPercent: line.percentOfBudgetUsed
        });
      }
    }

    return alerts;
  }

  /**
   * Get budget analysis for a fiscal period
   */
  async getPeriodBudgetAnalysis(
    tenantId: string,
    fiscalPeriodId: string
  ): Promise<BudgetAnalysis[]> {
    const budgets = await this.budgetService.getBudgets(tenantId);
    const periodBudgets = budgets.filter(b => b.fiscalPeriodId === fiscalPeriodId);

    return await Promise.all(
      periodBudgets.map(budget => this.analyzeBudget(budget.id))
    );
  }

  /**
   * Get budget trend over multiple periods
   */
  async getBudgetTrend(
    tenantId: string,
    periods: Array<{ start: Date; end: Date }>
  ): Promise<{
    periodAnalyses: BudgetAnalysis[];
    trend: {
      budgetedAmounts: number[];
      actualAmounts: number[];
      variances: number[];
    };
  }> {
    // In a real implementation, fetch budgets for each period
    const periodAnalyses: BudgetAnalysis[] = [];
    const budgetedAmounts: number[] = [];
    const actualAmounts: number[] = [];
    const variances: number[] = [];

    return {
      periodAnalyses,
      trend: {
        budgetedAmounts,
        actualAmounts,
        variances
      }
    };
  }

  /**
   * Get top budget variances (positive and negative)
   */
  async getTopVariances(
    budgetId: string,
    limit: number = 10
  ): Promise<{
    overBudget: BudgetLineAnalysis[];
    underBudget: BudgetLineAnalysis[];
  }> {
    const analysis = await this.analyzeBudget(budgetId);

    const overBudget = analysis.lines
      .filter(line => line.status === 'OVER_BUDGET')
      .sort((a, b) => b.variancePercent - a.variancePercent)
      .slice(0, limit);

    const underBudget = analysis.lines
      .filter(line => line.status === 'UNDER_BUDGET')
      .sort((a, b) => a.variancePercent - b.variancePercent)
      .slice(0, limit);

    return { overBudget, underBudget };
  }

  /**
   * Get budget performance summary
   */
  async getPerformanceSummary(
    tenantId: string
  ): Promise<{
    totalBudgets: number;
    onTrackBudgets: number;
    overBudgetBudgets: number;
    underBudgetBudgets: number;
    averageVariancePercent: number;
  }> {
    const budgets = await this.budgetService.getBudgets(tenantId);
    const analyses = await Promise.all(
      budgets.map(budget => this.analyzeBudget(budget.id))
    );

    const onTrackBudgets = analyses.filter(a => Math.abs(a.variancePercent) <= 10).length;
    const overBudgetBudgets = analyses.filter(a => a.variancePercent > 10).length;
    const underBudgetBudgets = analyses.filter(a => a.variancePercent < -10).length;
    const averageVariancePercent = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.variancePercent, 0) / analyses.length
      : 0;

    return {
      totalBudgets: budgets.length,
      onTrackBudgets,
      overBudgetBudgets,
      underBudgetBudgets,
      averageVariancePercent
    };
  }
}

export default new BudgetAnalysisService();
