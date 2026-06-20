import prisma from '../../config/database';

/**
 * Margin Analysis Service
 * Analyzes profit margins across different dimensions
 * 
 * Helps identify high-margin services, customers, and opportunities for improvement
 */

export interface MarginData {
  entityId: string;
  entityName: string;
  entityType: 'SERVICE' | 'CUSTOMER' | 'PRODUCT';
  revenueSYP: number;
  costSYP: number;
  grossProfitSYP: number;
  grossMarginPercent: number;
  netProfitSYP: number;
  netMarginPercent: number;
  transactionCount: number;
}

export interface MarginTrend {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  revenueSYP: number;
  costSYP: number;
  grossProfitSYP: number;
  grossMarginPercent: number;
  netProfitSYP: number;
  netMarginPercent: number;
}

export interface MarginAnalysis {
  tenantId: string;
  currencyCode: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenueSYP: number;
  totalCostSYP: number;
  totalGrossProfitSYP: number;
  averageGrossMarginPercent: number;
  totalNetProfitSYP: number;
  averageNetMarginPercent: number;
  marginByEntity: MarginData[];
  marginTrend: MarginTrend[];
  generatedAt: Date;
}

export class MarginAnalysisService {
  /**
   * Generate margin analysis for a tenant
   */
  async generateMarginAnalysis(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    currencyCode: string = 'SYP'
  ): Promise<MarginAnalysis> {
    // Get margin data by entity
    const marginByEntity = await this.getMarginByEntity(tenantId, startDate, endDate);
    const marginTrend = await this.getMarginTrend(tenantId, startDate, endDate, 'MONTHLY');

    const totalRevenueSYP = marginByEntity.reduce((sum, m) => sum + m.revenueSYP, 0);
    const totalCostSYP = marginByEntity.reduce((sum, m) => sum + m.costSYP, 0);
    const totalGrossProfitSYP = totalRevenueSYP - totalCostSYP;
    const averageGrossMarginPercent = totalRevenueSYP > 0 ? (totalGrossProfitSYP / totalRevenueSYP) * 100 : 0;
    
    // Simplified net profit calculation (would include overhead, taxes, etc.)
    const totalNetProfitSYP = totalGrossProfitSYP * 0.8; // 20% overhead/taxes
    const averageNetMarginPercent = totalRevenueSYP > 0 ? (totalNetProfitSYP / totalRevenueSYP) * 100 : 0;

    return {
      tenantId,
      currencyCode,
      periodStart: startDate,
      periodEnd: endDate,
      totalRevenueSYP,
      totalCostSYP,
      totalGrossProfitSYP,
      averageGrossMarginPercent,
      totalNetProfitSYP,
      averageNetMarginPercent,
      marginByEntity,
      marginTrend,
      generatedAt: new Date()
    };
  }

  /**
   * Get margin data by entity
   */
  private async getMarginByEntity(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarginData[]> {
    // In a real implementation, this would analyze invoices, costs, and overhead
    // For now, return mock data
    return [
      {
        entityId: '1',
        entityName: 'Oil Change',
        entityType: 'SERVICE',
        revenueSYP: 5000000,
        costSYP: 3000000,
        grossProfitSYP: 2000000,
        grossMarginPercent: 40,
        netProfitSYP: 1600000,
        netMarginPercent: 32,
        transactionCount: 100
      },
      {
        entityId: '2',
        entityName: 'Brake Service',
        entityType: 'SERVICE',
        revenueSYP: 4000000,
        costSYP: 2800000,
        grossProfitSYP: 1200000,
        grossMarginPercent: 30,
        netProfitSYP: 960000,
        netMarginPercent: 24,
        transactionCount: 60
      },
      {
        entityId: '3',
        entityName: 'Engine Repair',
        entityType: 'SERVICE',
        revenueSYP: 6000000,
        costSYP: 4200000,
        grossProfitSYP: 1800000,
        grossMarginPercent: 30,
        netProfitSYP: 1440000,
        netMarginPercent: 24,
        transactionCount: 30
      }
    ];
  }

  /**
   * Get margin trend over time
   */
  private async getMarginTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'MONTHLY'
  ): Promise<MarginTrend[]> {
    const periods = this.generatePeriods(startDate, endDate, periodType);

    return await Promise.all(
      periods.map(async (period) => {
        return await this.getMarginForPeriod(tenantId, period.start, period.end);
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
   * Get margin for a specific period
   */
  private async getMarginForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarginTrend> {
    // Get revenue
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const revenueSYP = invoices.reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
    const costSYP = revenueSYP * 0.6; // Simplified cost calculation
    const grossProfitSYP = revenueSYP - costSYP;
    const grossMarginPercent = revenueSYP > 0 ? (grossProfitSYP / revenueSYP) * 100 : 0;
    const netProfitSYP = grossProfitSYP * 0.8;
    const netMarginPercent = revenueSYP > 0 ? (netProfitSYP / revenueSYP) * 100 : 0;

    return {
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      periodStart: startDate,
      periodEnd: endDate,
      revenueSYP,
      costSYP,
      grossProfitSYP,
      grossMarginPercent,
      netProfitSYP,
      netMarginPercent
    };
  }

  /**
   * Get highest margin entities
   */
  async getHighestMarginEntities(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    entityType: 'SERVICE' | 'CUSTOMER' | 'PRODUCT' = 'SERVICE',
    limit: number = 10
  ): Promise<MarginData[]> {
    const marginAnalysis = await this.generateMarginAnalysis(tenantId, startDate, endDate);

    return marginAnalysis.marginByEntity
      .filter(m => m.entityType === entityType)
      .sort((a, b) => b.grossMarginPercent - a.grossMarginPercent)
      .slice(0, limit);
  }

  /**
   * Get lowest margin entities
   */
  async getLowestMarginEntities(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    entityType: 'SERVICE' | 'CUSTOMER' | 'PRODUCT' = 'SERVICE',
    limit: number = 10
  ): Promise<MarginData[]> {
    const marginAnalysis = await this.generateMarginAnalysis(tenantId, startDate, endDate);

    return marginAnalysis.marginByEntity
      .filter(m => m.entityType === entityType)
      .sort((a, b) => a.grossMarginPercent - b.grossMarginPercent)
      .slice(0, limit);
  }

  /**
   * Compare margins between periods
   */
  async compareMargins(
    tenantId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<{
    currentPeriod: MarginAnalysis;
    previousPeriod: MarginAnalysis;
    grossMarginChangePercent: number;
    netMarginChangePercent: number;
  }> {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.generateMarginAnalysis(tenantId, currentStart, currentEnd),
      this.generateMarginAnalysis(tenantId, previousStart, previousEnd)
    ]);

    const grossMarginChangePercent = currentPeriod.averageGrossMarginPercent - previousPeriod.averageGrossMarginPercent;
    const netMarginChangePercent = currentPeriod.averageNetMarginPercent - previousPeriod.averageNetMarginPercent;

    return {
      currentPeriod,
      previousPeriod,
      grossMarginChangePercent,
      netMarginChangePercent
    };
  }

  /**
   * Get margin summary for dashboard
   */
  async getMarginSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    averageGrossMarginPercent: number;
    averageNetMarginPercent: number;
    marginTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    highestMarginEntity: MarginData | null;
    lowestMarginEntity: MarginData | null;
  }> {
    const marginAnalysis = await this.generateMarginAnalysis(tenantId, startDate, endDate);

    const highestMarginEntity = marginAnalysis.marginByEntity.length > 0
      ? marginAnalysis.marginByEntity.reduce((max, m) => m.grossMarginPercent > max.grossMarginPercent ? m : max)
      : null;
    const lowestMarginEntity = marginAnalysis.marginByEntity.length > 0
      ? marginAnalysis.marginByEntity.reduce((min, m) => m.grossMarginPercent < min.grossMarginPercent ? m : min)
      : null;

    // Determine trend from margin trend data
    const marginTrend: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    if (marginAnalysis.marginTrend.length >= 2) {
      const first = marginAnalysis.marginTrend[0].grossMarginPercent;
      const last = marginAnalysis.marginTrend[marginAnalysis.marginTrend.length - 1].grossMarginPercent;
      if (last > first + 2) {
        // marginTrend = 'IMPROVING';
      } else if (last < first - 2) {
        // marginTrend = 'DECLINING';
      }
    }

    return {
      averageGrossMarginPercent: marginAnalysis.averageGrossMarginPercent,
      averageNetMarginPercent: marginAnalysis.averageNetMarginPercent,
      marginTrend,
      highestMarginEntity,
      lowestMarginEntity
    };
  }
}

export default new MarginAnalysisService();
