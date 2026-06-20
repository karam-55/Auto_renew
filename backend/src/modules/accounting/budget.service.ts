import prisma from '../../config/database';

/**
 * Budget Service
 * Manages budget creation, tracking, and variance analysis
 * 
 * Budgets help control spending and compare planned vs actual expenses
 */

export interface BudgetLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  budgetedAmountSYP: number;
  budgetedAmountUSD?: number;
  actualAmountSYP: number;
  actualAmountUSD?: number;
  varianceSYP: number;
  variancePercent: number;
}

export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  fiscalPeriodId?: string;
  startDate: Date;
  endDate: Date;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  totalBudgetedSYP: number;
  totalActualSYP: number;
  totalVarianceSYP: number;
  lines: BudgetLine[];
  createdAt: Date;
  updatedAt: Date;
}

export class BudgetService {
  /**
   * Create a new budget
   */
  async createBudget(
    tenantId: string,
    name: string,
    description: string | undefined,
    startDate: Date,
    endDate: Date,
    fiscalPeriodId?: string
  ): Promise<Budget> {
    // In a real implementation, this would create budget records in the database
    // For now, return a mock budget
    return {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description,
      fiscalPeriodId,
      startDate,
      endDate,
      status: 'DRAFT',
      totalBudgetedSYP: 0,
      totalActualSYP: 0,
      totalVarianceSYP: 0,
      lines: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get budget by ID
   */
  async getBudget(id: string): Promise<Budget | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all budgets for a tenant
   */
  async getBudgets(
    tenantId: string,
    status?: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED'
  ): Promise<Budget[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Add budget line
   */
  async addBudgetLine(
    budgetId: string,
    accountId: string,
    budgetedAmountSYP: number,
    budgetedAmountUSD?: number
  ): Promise<BudgetLine> {
    // Get account details
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Calculate actual amount from journal entries
    const actualAmountSYP = await this.calculateActualAmount(
      accountId,
      new Date(), // Would use budget period
      new Date()
    );

    const varianceSYP = actualAmountSYP - budgetedAmountSYP;
    const variancePercent = budgetedAmountSYP > 0
      ? (varianceSYP / budgetedAmountSYP) * 100
      : 0;

    return {
      accountId,
      accountCode: account.code,
      accountName: account.nameEn || account.nameAr,
      budgetedAmountSYP,
      budgetedAmountUSD,
      actualAmountSYP,
      actualAmountUSD: budgetedAmountUSD ? actualAmountSYP / 13000 : undefined,
      varianceSYP,
      variancePercent
    };
  }

  /**
   * Calculate actual amount for an account
   */
  private async calculateActualAmount(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const journalLines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          entryDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'POSTED'
        }
      }
    });

    let totalSYP = 0;
    for (const line of journalLines) {
      totalSYP += Number(line.debitSYP || 0) - Number(line.creditSYP || 0);
    }

    return Math.abs(totalSYP);
  }

  /**
   * Update budget status
   */
  async updateBudgetStatus(
    id: string,
    status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED'
  ): Promise<Budget> {
    // In a real implementation, update in database
    const budget = await this.getBudget(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    return { ...budget, status, updatedAt: new Date() };
  }

  /**
   * Calculate budget variance
   */
  async calculateBudgetVariance(budgetId: string): Promise<Budget> {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    // Calculate actual amounts for all lines
    const updatedLines = await Promise.all(
      budget.lines.map(async (line) => {
        const actualAmountSYP = await this.calculateActualAmount(
          line.accountId,
          budget.startDate,
          budget.endDate
        );
        const varianceSYP = actualAmountSYP - line.budgetedAmountSYP;
        const variancePercent = line.budgetedAmountSYP > 0
          ? (varianceSYP / line.budgetedAmountSYP) * 100
          : 0;

        return {
          ...line,
          actualAmountSYP,
          actualAmountUSD: line.budgetedAmountUSD ? actualAmountSYP / 13000 : undefined,
          varianceSYP,
          variancePercent
        };
      })
    );

    const totalBudgetedSYP = updatedLines.reduce((sum, line) => sum + line.budgetedAmountSYP, 0);
    const totalActualSYP = updatedLines.reduce((sum, line) => sum + line.actualAmountSYP, 0);
    const totalVarianceSYP = totalActualSYP - totalBudgetedSYP;

    return {
      ...budget,
      lines: updatedLines,
      totalBudgetedSYP,
      totalActualSYP,
      totalVarianceSYP,
      updatedAt: new Date()
    };
  }

  /**
   * Get budget by fiscal period
   */
  async getBudgetByFiscalPeriod(
    tenantId: string,
    fiscalPeriodId: string
  ): Promise<Budget | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Copy budget to new period
   */
  async copyBudget(
    budgetId: string,
    newStartDate: Date,
    newEndDate: Date,
    newName?: string
  ): Promise<Budget> {
    const originalBudget = await this.getBudget(budgetId);
    if (!originalBudget) {
      throw new Error('Budget not found');
    }

    return await this.createBudget(
      originalBudget.tenantId,
      newName || `${originalBudget.name} (Copy)`,
      originalBudget.description,
      newStartDate,
      newEndDate
    );
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Get budget summary for dashboard
   */
  async getBudgetSummary(tenantId: string): Promise<{
    totalBudgets: number;
    activeBudgets: number;
    totalBudgetedSYP: number;
    totalActualSYP: number;
    overallVariancePercent: number;
  }> {
    // In a real implementation, calculate from database
    return {
      totalBudgets: 0,
      activeBudgets: 0,
      totalBudgetedSYP: 0,
      totalActualSYP: 0,
      overallVariancePercent: 0
    };
  }
}

export default new BudgetService();
