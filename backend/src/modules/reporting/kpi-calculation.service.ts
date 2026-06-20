import prisma from '../../config/database';
import { KPIDefinitionsService, KPIDefinition, KPIValue } from './kpi-definitions.service';

/**
 * KPI Calculation Engine
 * Calculates KPI values based on definitions and formulas
 * 
 * Evaluates KPIs against targets and determines status
 */

export class KPICalculationService {
  private kpiDefinitionsService = new KPIDefinitionsService();

  /**
   * Calculate KPI value for a specific definition and period
   */
  async calculateKPI(
    tenantId: string,
    kpiDefinitionId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KPIValue> {
    const kpiDefinition = await this.kpiDefinitionsService.getKPIDefinition(kpiDefinitionId);
    if (!kpiDefinition) {
      throw new Error('KPI definition not found');
    }

    // Calculate value based on KPI code
    const value = await this.calculateKPIValue(tenantId, kpiDefinition.code, periodStart, periodEnd);

    // Calculate variance against target
    const targetValue = kpiDefinition.targetValue;
    const variance = targetValue !== undefined ? value - targetValue : undefined;
    const variancePercent = targetValue !== undefined && targetValue !== 0
      ? ((value - targetValue) / targetValue) * 100
      : undefined;

    // Determine status
    const status = this.determineKPIStatus(value, targetValue, kpiDefinition.targetOperator);

    return {
      id: crypto.randomUUID(),
      kpiDefinitionId,
      tenantId,
      periodStart,
      periodEnd,
      value,
      targetValue,
      variance,
      variancePercent,
      status,
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate KPI value based on code
   */
  private async calculateKPIValue(
    tenantId: string,
    kpiCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    switch (kpiCode) {
      case 'TOTAL_REVENUE':
        return await this.calculateTotalRevenue(tenantId, startDate, endDate);
      case 'GROSS_MARGIN':
        return await this.calculateGrossMargin(tenantId, startDate, endDate);
      case 'CUSTOMER_SATISFACTION':
        return await this.calculateCustomerSatisfaction(tenantId, startDate, endDate);
      case 'JOB_COMPLETION_RATE':
        return await this.calculateJobCompletionRate(tenantId, startDate, endDate);
      case 'EMPLOYEE_UTILIZATION':
        return await this.calculateEmployeeUtilization(tenantId, startDate, endDate);
      default:
        return 0;
    }
  }

  /**
   * Calculate total revenue
   */
  private async calculateTotalRevenue(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return invoices.reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
  }

  /**
   * Calculate gross margin percentage
   */
  private async calculateGrossMargin(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const revenue = await this.calculateTotalRevenue(tenantId, startDate, endDate);
    const cost = revenue * 0.6; // Simplified cost calculation

    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  }

  /**
   * Calculate customer satisfaction rating
   */
  private async calculateCustomerSatisfaction(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In a real implementation, calculate from customer feedback
    return 4.2; // Mock value
  }

  /**
   * Calculate job completion rate
   */
  private async calculateJobCompletionRate(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalJobs = bookings.length;
    const completedJobs = bookings.filter(b => b.status === 'COMPLETED').length;

    return totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  }

  /**
   * Calculate employee utilization
   */
  private async calculateEmployeeUtilization(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In a real implementation, calculate from employee hours
    return 78; // Mock value
  }

  /**
   * Determine KPI status based on value and target
   */
  private determineKPIStatus(
    value: number,
    targetValue: number | undefined,
    targetOperator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'BETWEEN' | undefined
  ): 'ON_TARGET' | 'BELOW_TARGET' | 'ABOVE_TARGET' {
    if (targetValue === undefined) {
      return 'ON_TARGET';
    }

    switch (targetOperator) {
      case 'GREATER_THAN':
        return value >= targetValue ? 'ON_TARGET' : 'BELOW_TARGET';
      case 'LESS_THAN':
        return value <= targetValue ? 'ON_TARGET' : 'ABOVE_TARGET';
      case 'EQUAL_TO':
        return Math.abs(value - targetValue) < 0.01 ? 'ON_TARGET' : 'BELOW_TARGET';
      case 'BETWEEN':
        // Simplified - would need min/max values
        return 'ON_TARGET';
      default:
        return 'ON_TARGET';
    }
  }

  /**
   * Calculate all KPIs for a tenant and period
   */
  async calculateAllKPIs(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KPIValue[]> {
    const kpiDefinitions = await this.kpiDefinitionsService.getKPIDefinitions(tenantId, undefined, true);

    return await Promise.all(
      kpiDefinitions.map(kpiDef =>
        this.calculateKPI(tenantId, kpiDef.id, startDate, endDate)
      )
    );
  }

  /**
   * Get KPI values for a specific period
   */
  async getKPIValues(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<KPIValue[]> {
    // In a real implementation, fetch from database
    return await this.calculateAllKPIs(tenantId, startDate, endDate);
  }

  /**
   * Get KPI trend over multiple periods
   */
  async getKPITrend(
    tenantId: string,
    kpiDefinitionId: string,
    periods: Array<{ start: Date; end: Date }>
  ): Promise<{
    kpiDefinitionId: string;
    kpiName: string;
    periodValues: Array<{
      period: string;
      value: number;
      targetValue?: number;
      status: 'ON_TARGET' | 'BELOW_TARGET' | 'ABOVE_TARGET';
    }>;
    trend: {
      values: number[];
      average: number;
      growthRate: number;
    };
  }> {
    const kpiDefinition = await this.kpiDefinitionsService.getKPIDefinition(kpiDefinitionId);
    if (!kpiDefinition) {
      throw new Error('KPI definition not found');
    }

    const periodValues = await Promise.all(
      periods.map(async (period) => {
        const kpiValue = await this.calculateKPI(tenantId, kpiDefinitionId, period.start, period.end);
        return {
          period: `${period.start.toISOString().split('T')[0]} - ${period.end.toISOString().split('T')[0]}`,
          value: kpiValue.value,
          targetValue: kpiValue.targetValue,
          status: kpiValue.status
        };
      })
    );

    const values = periodValues.map(pv => pv.value);
    const average = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    const growthRate = values.length >= 2
      ? ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100
      : 0;

    return {
      kpiDefinitionId,
      kpiName: kpiDefinition.name,
      periodValues,
      trend: {
        values,
        average,
        growthRate
      }
    };
  }

  /**
   * Get KPI summary for dashboard
   */
  async getKPISummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalKPIs: number;
    onTargetKPIs: number;
    belowTargetKPIs: number;
    aboveTargetKPIs: number;
    averageScore: number;
  }> {
    const kpiValues = await this.getKPIValues(tenantId, startDate, endDate);

    const onTargetKPIs = kpiValues.filter(kv => kv.status === 'ON_TARGET').length;
    const belowTargetKPIs = kpiValues.filter(kv => kv.status === 'BELOW_TARGET').length;
    const aboveTargetKPIs = kpiValues.filter(kv => kv.status === 'ABOVE_TARGET').length;

    // Calculate average score (normalized to 0-100)
    const averageScore = kpiValues.length > 0
      ? kpiValues.reduce((sum, kv) => {
          const score = kv.targetValue !== undefined
            ? (kv.value / kv.targetValue) * 100
            : 50; // Default score if no target
          return sum + Math.min(Math.max(score, 0), 100);
        }, 0) / kpiValues.length
      : 0;

    return {
      totalKPIs: kpiValues.length,
      onTargetKPIs,
      belowTargetKPIs,
      aboveTargetKPIs,
      averageScore
    };
  }
}

export default new KPICalculationService();
