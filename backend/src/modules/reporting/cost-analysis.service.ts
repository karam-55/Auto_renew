import prisma from '../../config/database';

/**
 * Cost Analysis Reports Service
 * Analyzes costs across different dimensions
 * 
 * Helps identify cost drivers, cost trends, and optimization opportunities
 */

export interface CostByCategory {
  categoryId: string;
  categoryName: string;
  totalCostSYP: number;
  costPercent: number;
  transactionCount: number;
  averageCostPerTransaction: number;
}

export interface CostByPeriod {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  totalCostSYP: number;
  laborCostSYP: number;
  partsCostSYP: number;
  overheadCostSYP: number;
  transactionCount: number;
}

export interface CostAnalysis {
  tenantId: string;
  currencyCode: string;
  periodStart: Date;
  periodEnd: Date;
  totalCostSYP: number;
  laborCostSYP: number;
  partsCostSYP: number;
  overheadCostSYP: number;
  costByCategory: CostByCategory[];
  costByPeriod: CostByPeriod[];
  generatedAt: Date;
}

export class CostAnalysisService {
  /**
   * Generate cost analysis for a tenant
   */
  async generateCostAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    currencyCode: string = 'SYP'
  ): Promise<CostAnalysis> {
    // Get cost data from inventory and other sources
    const costByCategory = await this.getCostByCategory(tenantId, startDate, endDate);
    const costByPeriod = await this.getCostByPeriod(tenantId, startDate, endDate, 'MONTHLY');

    const totalCostSYP = costByCategory.reduce((sum, c) => sum + c.totalCostSYP, 0);
    const laborCostSYP = totalCostSYP * 0.4; // Simplified calculation
    const partsCostSYP = totalCostSYP * 0.5; // Simplified calculation
    const overheadCostSYP = totalCostSYP * 0.1; // Simplified calculation

    return {
      tenantId,
      currencyCode,
      periodStart: startDate,
      periodEnd: endDate,
      totalCostSYP,
      laborCostSYP,
      partsCostSYP,
      overheadCostSYP,
      costByCategory,
      costByPeriod,
      generatedAt: new Date()
    };
  }

  /**
   * Get cost breakdown by category
   */
  private async getCostByCategory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostByCategory[]> {
    // In a real implementation, this would analyze inventory movements and labor costs
    // For now, return mock data
    return [
      {
        categoryId: '1',
        categoryName: 'Parts',
        totalCostSYP: 8000000,
        costPercent: 50,
        transactionCount: 200,
        averageCostPerTransaction: 40000
      },
      {
        categoryId: '2',
        categoryName: 'Labor',
        totalCostSYP: 6400000,
        costPercent: 40,
        transactionCount: 150,
        averageCostPerTransaction: 42667
      },
      {
        categoryId: '3',
        categoryName: 'Overhead',
        totalCostSYP: 1600000,
        costPercent: 10,
        transactionCount: 50,
        averageCostPerTransaction: 32000
      }
    ];
  }

  /**
   * Get cost breakdown by period
   */
  private async getCostByPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<CostByPeriod[]> {
    // Generate periods
    const periods = this.generatePeriods(startDate, endDate, periodType);

    return await Promise.all(
      periods.map(async (period) => {
        return await this.getCostForPeriod(tenantId, period.start, period.end);
      })
    );
  }

  /**
   * Generate periods
   */
  private generatePeriods(
    startDate: Date,
    endDate: Date,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Array<{ start: Date; end: Date }> {
    const periods: Array<{ start: Date; end: Date }> = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      let periodEnd: Date;

      switch (periodType) {
        case 'DAILY':
          periodEnd = new Date(current);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'WEEKLY':
          periodEnd = new Date(current);
          periodEnd.setDate(periodEnd.getDate() + 6);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'MONTHLY':
          periodEnd = new Date(current);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          periodEnd.setDate(0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        default:
          periodEnd = new Date(current);
      }

      if (periodEnd > endDate) {
        periodEnd = new Date(endDate);
      }

      periods.push({
        start: new Date(current),
        end: periodEnd
      });

      current = new Date(periodEnd);
      current.setDate(current.getDate() + 1);
    }

    return periods;
  }

  /**
   * Get cost for a specific period
   */
  private async getCostForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostByPeriod> {
    // In a real implementation, calculate from actual data
    const totalCostSYP = 5000000;
    const laborCostSYP = totalCostSYP * 0.4;
    const partsCostSYP = totalCostSYP * 0.5;
    const overheadCostSYP = totalCostSYP * 0.1;

    return {
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      periodStart: startDate,
      periodEnd: endDate,
      totalCostSYP,
      laborCostSYP,
      partsCostSYP,
      overheadCostSYP,
      transactionCount: 50
    };
  }

  /**
   * Compare costs between periods
   */
  async compareCosts(
    tenantId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<{
    currentPeriod: CostAnalysis;
    previousPeriod: CostAnalysis;
    costChangePercent: number;
    laborCostChangePercent: number;
    partsCostChangePercent: number;
    overheadCostChangePercent: number;
  }> {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.generateCostAnalysis(tenantId, currentStart, currentEnd),
      this.generateCostAnalysis(tenantId, previousStart, previousEnd)
    ]);

    const costChangePercent = previousPeriod.totalCostSYP > 0
      ? ((currentPeriod.totalCostSYP - previousPeriod.totalCostSYP) / previousPeriod.totalCostSYP) * 100
      : 0;
    const laborCostChangePercent = previousPeriod.laborCostSYP > 0
      ? ((currentPeriod.laborCostSYP - previousPeriod.laborCostSYP) / previousPeriod.laborCostSYP) * 100
      : 0;
    const partsCostChangePercent = previousPeriod.partsCostSYP > 0
      ? ((currentPeriod.partsCostSYP - previousPeriod.partsCostSYP) / previousPeriod.partsCostSYP) * 100
      : 0;
    const overheadCostChangePercent = previousPeriod.overheadCostSYP > 0
      ? ((currentPeriod.overheadCostSYP - previousPeriod.overheadCostSYP) / previousPeriod.overheadCostSYP) * 100
      : 0;

    return {
      currentPeriod,
      previousPeriod,
      costChangePercent,
      laborCostChangePercent,
      partsCostChangePercent,
      overheadCostChangePercent
    };
  }

  /**
   * Get cost efficiency metrics
   */
  async getCostEfficiencyMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    costPerRevenue: number;
    laborCostPercent: number;
    partsCostPercent: number;
    overheadCostPercent: number;
    averageCostPerJob: number;
  }> {
    const costAnalysis = await this.generateCostAnalysis(tenantId, startDate, endDate);

    // Get revenue for the same period
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalRevenueSYP = invoices.reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
    const costPerRevenue = totalRevenueSYP > 0 ? (costAnalysis.totalCostSYP / totalRevenueSYP) * 100 : 0;
    const laborCostPercent = costAnalysis.totalCostSYP > 0 ? (costAnalysis.laborCostSYP / costAnalysis.totalCostSYP) * 100 : 0;
    const partsCostPercent = costAnalysis.totalCostSYP > 0 ? (costAnalysis.partsCostSYP / costAnalysis.totalCostSYP) * 100 : 0;
    const overheadCostPercent = costAnalysis.totalCostSYP > 0 ? (costAnalysis.overheadCostSYP / costAnalysis.totalCostSYP) * 100 : 0;

    const totalJobs = costAnalysis.costByCategory.reduce((sum, c) => sum + c.transactionCount, 0);
    const averageCostPerJob = totalJobs > 0 ? costAnalysis.totalCostSYP / totalJobs : 0;

    return {
      costPerRevenue,
      laborCostPercent,
      partsCostPercent,
      overheadCostPercent,
      averageCostPerJob
    };
  }

  /**
   * Get cost summary for dashboard
   */
  async getCostSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCostSYP: number;
    laborCostSYP: number;
    partsCostSYP: number;
    overheadCostSYP: number;
    costTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    topCostCategory: CostByCategory | null;
  }> {
    const costAnalysis = await this.generateCostAnalysis(tenantId, startDate, endDate);

    const topCostCategory = costAnalysis.costByCategory.length > 0
      ? costAnalysis.costByCategory.reduce((max, c) => c.totalCostSYP > max.totalCostSYP ? c : max)
      : null;

    // Determine trend (simplified)
    const costTrend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';

    return {
      totalCostSYP: costAnalysis.totalCostSYP,
      laborCostSYP: costAnalysis.laborCostSYP,
      partsCostSYP: costAnalysis.partsCostSYP,
      overheadCostSYP: costAnalysis.overheadCostSYP,
      costTrend,
      topCostCategory
    };
  }
}

export default new CostAnalysisService();
