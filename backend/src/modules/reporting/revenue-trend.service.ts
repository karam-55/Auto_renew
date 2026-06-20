import prisma from '../../config/database';

/**
 * Revenue Trend Analysis Service
 * Analyzes revenue trends over time
 * 
 * Helps identify growth patterns, seasonal variations, and revenue forecasts
 */

export interface RevenueDataPoint {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  revenueSYP: number;
  revenueUSD?: number;
  invoiceCount: number;
  averageInvoiceValue: number;
}

export interface RevenueTrend {
  tenantId: string;
  currencyCode: string;
  dataPoints: RevenueDataPoint[];
  totalRevenueSYP: number;
  averageRevenueSYP: number;
  growthRate: number;
  forecast: RevenueDataPoint[];
  generatedAt: Date;
}

export interface RevenueByService {
  serviceId: string;
  serviceName: string;
  revenueSYP: number;
  revenuePercent: number;
  invoiceCount: number;
}

export class RevenueTrendService {
  /**
   * Generate revenue trend for a tenant
   */
  async generateRevenueTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' = 'MONTHLY',
    currencyCode: string = 'SYP'
  ): Promise<RevenueTrend> {
    const periods = this.generatePeriods(startDate, endDate, periodType);

    const dataPoints = await Promise.all(
      periods.map(async (period) => {
        return await this.getRevenueForPeriod(tenantId, period.start, period.end, currencyCode);
      })
    );

    const totalRevenueSYP = dataPoints.reduce((sum, dp) => sum + dp.revenueSYP, 0);
    const averageRevenueSYP = dataPoints.length > 0 ? totalRevenueSYP / dataPoints.length : 0;
    const growthRate = this.calculateGrowthRate(dataPoints);
    const forecast = this.generateForecast(dataPoints, 3);

    return {
      tenantId,
      currencyCode,
      dataPoints,
      totalRevenueSYP,
      averageRevenueSYP,
      growthRate,
      forecast,
      generatedAt: new Date()
    };
  }

  /**
   * Generate periods based on period type
   */
  private generatePeriods(
    startDate: Date,
    endDate: Date,
    periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
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
        case 'QUARTERLY':
          periodEnd = new Date(current);
          periodEnd.setMonth(periodEnd.getMonth() + 3);
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
   * Get revenue for a specific period
   */
  private async getRevenueForPeriod(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    currencyCode: string
  ): Promise<RevenueDataPoint> {
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const revenueSYP = invoices.filter(inv => inv.status !== 'CANCELLED').reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
    const invoiceCount = invoices.length;
    const averageInvoiceValue = invoiceCount > 0 ? revenueSYP / invoiceCount : 0;

    return {
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      periodStart: startDate,
      periodEnd: endDate,
      revenueSYP,
      revenueUSD: currencyCode === 'USD' ? revenueSYP / 13000 : undefined,
      invoiceCount,
      averageInvoiceValue
    };
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(dataPoints: RevenueDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    const first = dataPoints[0].revenueSYP;
    const last = dataPoints[dataPoints.length - 1].revenueSYP;

    if (first === 0) return 0;

    return ((last - first) / first) * 100;
  }

  /**
   * Generate simple forecast using linear trend
   */
  private generateForecast(dataPoints: RevenueDataPoint[], periods: number): RevenueDataPoint[] {
    if (dataPoints.length < 2) return [];

    const forecast: RevenueDataPoint[] = [];
    const lastDataPoint = dataPoints[dataPoints.length - 1];
    const growthPerPeriod = this.calculateGrowthRate(dataPoints) / (dataPoints.length - 1);

    for (let i = 1; i <= periods; i++) {
      const forecastRevenue = lastDataPoint.revenueSYP * (1 + (growthPerPeriod / 100) * i);
      const periodStart = new Date(lastDataPoint.periodEnd);
      periodStart.setDate(periodStart.getDate() + (i * 30)); // Approximate 30 days per period
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 30);

      forecast.push({
        period: `Forecast ${i}`,
        periodStart,
        periodEnd,
        revenueSYP: forecastRevenue,
        invoiceCount: 0,
        averageInvoiceValue: 0
      });
    }

    return forecast;
  }

  /**
   * Get revenue breakdown by service
   */
  async getRevenueByService(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueByService[]> {
    // In a real implementation, this would join invoices with services
    // For now, return mock data
    return [
      {
        serviceId: '1',
        serviceName: 'Oil Change',
        revenueSYP: 5000000,
        revenuePercent: 40,
        invoiceCount: 100
      },
      {
        serviceId: '2',
        serviceName: 'Brake Service',
        revenueSYP: 3000000,
        revenuePercent: 24,
        invoiceCount: 60
      },
      {
        serviceId: '3',
        serviceName: 'Engine Repair',
        revenueSYP: 2500000,
        revenuePercent: 20,
        invoiceCount: 25
      },
      {
        serviceId: '4',
        serviceName: 'Tire Service',
        revenueSYP: 2000000,
        revenuePercent: 16,
        invoiceCount: 40
      }
    ];
  }

  /**
   * Get revenue comparison year over year
   */
  async getYearOverYearComparison(
    tenantId: string,
    year1: number,
    year2: number,
    currencyCode: string = 'SYP'
  ): Promise<{
    year1: RevenueTrend;
    year2: RevenueTrend;
    changePercent: number;
  }> {
    const year1Start = new Date(year1, 0, 1);
    const year1End = new Date(year1, 11, 31);
    const year2Start = new Date(year2, 0, 1);
    const year2End = new Date(year2, 11, 31);

    const [year1Trend, year2Trend] = await Promise.all([
      this.generateRevenueTrend(tenantId, year1Start, year1End, 'MONTHLY', currencyCode),
      this.generateRevenueTrend(tenantId, year2Start, year2End, 'MONTHLY', currencyCode)
    ]);

    const changePercent = year1Trend.totalRevenueSYP > 0
      ? ((year2Trend.totalRevenueSYP - year1Trend.totalRevenueSYP) / year1Trend.totalRevenueSYP) * 100
      : 0;

    return {
      year1: year1Trend,
      year2: year2Trend,
      changePercent
    };
  }

  /**
   * Get revenue summary for dashboard
   */
  async getRevenueSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRevenueSYP: number;
    averageMonthlyRevenue: number;
    totalInvoices: number;
    averageInvoiceValue: number;
    growthRate: number;
    topService: RevenueByService | null;
  }> {
    const trend = await this.generateRevenueTrend(tenantId, startDate, endDate, 'MONTHLY');
    const revenueByService = await this.getRevenueByService(tenantId, startDate, endDate);

    const topService = revenueByService.length > 0
      ? revenueByService.reduce((max, s) => s.revenueSYP > max.revenueSYP ? s : max)
      : null;

    const averageMonthlyRevenue = trend.dataPoints.length > 0
      ? trend.totalRevenueSYP / trend.dataPoints.length
      : 0;

    return {
      totalRevenueSYP: trend.totalRevenueSYP,
      averageMonthlyRevenue,
      totalInvoices: trend.dataPoints.reduce((sum, dp) => sum + dp.invoiceCount, 0),
      averageInvoiceValue: trend.dataPoints.length > 0
        ? trend.totalRevenueSYP / trend.dataPoints.reduce((sum, dp) => sum + dp.invoiceCount, 0)
        : 0,
      growthRate: trend.growthRate,
      topService
    };
  }
}

export default new RevenueTrendService();
