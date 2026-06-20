import prisma from '../../config/database';

/**
 * Aging Reports Service
 * Generates accounts receivable and accounts payable aging reports
 * 
 * Aging reports categorize outstanding balances by time periods
 */

export interface AgingBucket {
  label: string;
  labelAr?: string;
  daysMin: number;
  daysMax: number;
  amountSYP: number;
  amountUSD?: number;
  count: number;
  percentage: number;
}

export interface AgingReport {
  tenantId: string;
  reportType: 'AR' | 'AP';
  asOfDate: Date;
  currencyCode: string;
  totalAmountSYP: number;
  totalAmountUSD?: number;
  totalCount: number;
  buckets: AgingBucket[];
  generatedAt: Date;
}

export interface AgingDetail {
  entityId: string;
  entityName: string;
  entityType: 'CUSTOMER' | 'VENDOR';
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  daysOverdue: number;
  amountSYP: number;
  amountUSD?: number;
  bucket: string;
}

export class AgingReportsService {
  /**
   * Generate accounts receivable aging report
   */
  async generateARAgingReport(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'SYP'
  ): Promise<AgingReport> {
    // Get unpaid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        dueDate: {
          lt: asOfDate
        }
      },
      include: {
        customer: true
      }
    });

    // Calculate aging buckets
    const buckets = this.calculateAgingBuckets(invoices, asOfDate, 'dueDate', 'totalSYP');
    const totalAmountSYP = buckets.reduce((sum, b) => sum + b.amountSYP, 0);
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

    return {
      tenantId,
      reportType: 'AR',
      asOfDate,
      currencyCode,
      totalAmountSYP,
      totalAmountUSD: currencyCode === 'USD' ? totalAmountSYP / 13000 : undefined,
      totalCount,
      buckets,
      generatedAt: new Date()
    };
  }

  /**
   * Generate accounts payable aging report
   */
  async generateAPAgingReport(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'SYP'
  ): Promise<AgingReport> {
    // In a real implementation, get unpaid vendor invoices
    // For now, return mock data
    const buckets: AgingBucket[] = [
      {
        label: 'Current',
        labelAr: 'حالي',
        daysMin: 0,
        daysMax: 30,
        amountSYP: 5000000,
        count: 15,
        percentage: 25
      },
      {
        label: '1-30 Days',
        labelAr: '1-30 يوم',
        daysMin: 1,
        daysMax: 30,
        amountSYP: 3000000,
        count: 10,
        percentage: 15
      },
      {
        label: '31-60 Days',
        labelAr: '31-60 يوم',
        daysMin: 31,
        daysMax: 60,
        amountSYP: 4000000,
        count: 8,
        percentage: 20
      },
      {
        label: '61-90 Days',
        labelAr: '61-90 يوم',
        daysMin: 61,
        daysMax: 90,
        amountSYP: 3000000,
        count: 5,
        percentage: 15
      },
      {
        label: '90+ Days',
        labelAr: 'أكثر من 90 يوم',
        daysMin: 91,
        daysMax: 9999,
        amountSYP: 5000000,
        count: 3,
        percentage: 25
      }
    ];

    const totalAmountSYP = buckets.reduce((sum, b) => sum + b.amountSYP, 0);
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

    return {
      tenantId,
      reportType: 'AP',
      asOfDate,
      currencyCode,
      totalAmountSYP,
      totalAmountUSD: currencyCode === 'USD' ? totalAmountSYP / 13000 : undefined,
      totalCount,
      buckets,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate aging buckets from invoices
   */
  private calculateAgingBuckets(
    invoices: any[],
    asOfDate: Date,
    dateField: string,
    amountField: string
  ): AgingBucket[] {
    const bucketDefinitions = [
      { label: 'Current', labelAr: 'حالي', daysMin: 0, daysMax: 30 },
      { label: '1-30 Days', labelAr: '1-30 يوم', daysMin: 1, daysMax: 30 },
      { label: '31-60 Days', labelAr: '31-60 يوم', daysMin: 31, daysMax: 60 },
      { label: '61-90 Days', labelAr: '61-90 يوم', daysMin: 61, daysMax: 90 },
      { label: '90+ Days', labelAr: 'أكثر من 90 يوم', daysMin: 91, daysMax: 9999 }
    ];

    const buckets: AgingBucket[] = bucketDefinitions.map(def => ({
      ...def,
      amountSYP: 0,
      count: 0,
      percentage: 0
    }));

    let totalAmount = 0;

    for (const invoice of invoices) {
      const invoiceDate = new Date(invoice[dateField]);
      const daysOverdue = Math.floor((asOfDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(invoice[amountField] || 0);

      totalAmount += amount;

      for (const bucket of buckets) {
        if (daysOverdue >= bucket.daysMin && daysOverdue <= bucket.daysMax) {
          bucket.amountSYP += amount;
          bucket.count++;
          break;
        }
      }
    }

    // Calculate percentages
    for (const bucket of buckets) {
      bucket.percentage = totalAmount > 0 ? (bucket.amountSYP / totalAmount) * 100 : 0;
    }

    return buckets;
  }

  /**
   * Get aging details for a specific bucket
   */
  async getAgingDetails(
    tenantId: string,
    reportType: 'AR' | 'AP',
    asOfDate: Date,
    bucketLabel: string
  ): Promise<AgingDetail[]> {
    // In a real implementation, fetch detailed records
    return [];
  }

  /**
   * Get aging summary for dashboard
   */
  async getAgingSummary(
    tenantId: string,
    asOfDate: Date
  ): Promise<{
    arTotalSYP: number;
    apTotalSYP: number;
    arOver90DaysSYP: number;
    apOver90DaysSYP: number;
    netWorkingPosition: number;
  }> {
    const arReport = await this.generateARAgingReport(tenantId, asOfDate);
    const apReport = await this.generateAPAgingReport(tenantId, asOfDate);

    const arOver90DaysSYP = arReport.buckets
      .filter(b => b.daysMin >= 90)
      .reduce((sum, b) => sum + b.amountSYP, 0);

    const apOver90DaysSYP = apReport.buckets
      .filter(b => b.daysMin >= 90)
      .reduce((sum, b) => sum + b.amountSYP, 0);

    const netWorkingPosition = arReport.totalAmountSYP - apReport.totalAmountSYP;

    return {
      arTotalSYP: arReport.totalAmountSYP,
      apTotalSYP: apReport.totalAmountSYP,
      arOver90DaysSYP,
      apOver90DaysSYP,
      netWorkingPosition
    };
  }

  /**
   * Generate combined AR/AP aging report
   */
  async generateCombinedAgingReport(
    tenantId: string,
    asOfDate: Date,
    currencyCode: string = 'SYP'
  ): Promise<{
    arReport: AgingReport;
    apReport: AgingReport;
    netPosition: number;
  }> {
    const [arReport, apReport] = await Promise.all([
      this.generateARAgingReport(tenantId, asOfDate, currencyCode),
      this.generateAPAgingReport(tenantId, asOfDate, currencyCode)
    ]);

    const netPosition = arReport.totalAmountSYP - apReport.totalAmountSYP;

    return {
      arReport,
      apReport,
      netPosition
    };
  }

  /**
   * Get aging trend over multiple periods
   */
  async getAgingTrend(
    tenantId: string,
    periods: Array<{ start: Date; end: Date }>
  ): Promise<{
    periodReports: Array<{ period: string; arTotal: number; apTotal: number }>;
    trend: {
      arTrend: number[];
      apTrend: number[];
    };
  }> {
    // In a real implementation, generate reports for each period
    const periodReports = periods.map(p => ({
      period: `${p.start.toISOString().split('T')[0]} - ${p.end.toISOString().split('T')[0]}`,
      arTotal: 0,
      apTotal: 0
    }));

    return {
      periodReports,
      trend: {
        arTrend: periodReports.map(p => p.arTotal),
        apTrend: periodReports.map(p => p.apTotal)
      }
    };
  }
}

export default new AgingReportsService();
