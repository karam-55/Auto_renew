import prisma from '../../config/database';

/**
 * Service Profitability Analysis Service
 * Analyzes profitability of individual services
 * 
 * Helps identify which services are most profitable and which need improvement
 */

export interface ServiceProfitability {
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  totalRevenueSYP: number;
  totalCostSYP: number;
  grossProfitSYP: number;
  grossProfitMarginPercent: number;
  totalJobs: number;
  averageRevenuePerJob: number;
  averageCostPerJob: number;
  averageProfitPerJob: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface ServiceComparison {
  serviceId: string;
  serviceName: string;
  currentPeriod: ServiceProfitability;
  previousPeriod: ServiceProfitability;
  revenueChangePercent: number;
  profitChangePercent: number;
  marginChangePercent: number;
}

export class ServiceProfitabilityService {
  /**
   * Analyze profitability for a specific service
   */
  async analyzeServiceProfitability(
    tenantId: string,
    serviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceProfitability> {
    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Get bookings for this service in the period
    // Note: Booking model doesn't have serviceId directly, we'll use a simplified approach
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        invoices: true
      }
    });

    // Calculate totals (simplified for demo)
    let totalRevenueSYP = 0;
    let totalCostSYP = 0;

    for (const booking of bookings) {
      if (booking.invoices && booking.invoices.length > 0) {
        for (const invoice of booking.invoices) {
          totalRevenueSYP += Number(invoice.totalSYP || 0);
        }
      }
      // Simplified cost calculation (would use actual cost data in production)
      totalCostSYP += 0; // Placeholder - would calculate from parts/labor
    }

    const totalJobs = bookings.length;
    const grossProfitSYP = totalRevenueSYP - totalCostSYP;
    const grossProfitMarginPercent = totalRevenueSYP > 0
      ? (grossProfitSYP / totalRevenueSYP) * 100
      : 0;
    const averageRevenuePerJob = totalJobs > 0 ? totalRevenueSYP / totalJobs : 0;
    const averageCostPerJob = totalJobs > 0 ? totalCostSYP / totalJobs : 0;
    const averageProfitPerJob = totalJobs > 0 ? grossProfitSYP / totalJobs : 0;

    return {
      serviceId,
      serviceName: service.nameEn || service.nameAr || '',
      serviceNameAr: service.nameAr || undefined,
      totalRevenueSYP,
      totalCostSYP,
      grossProfitSYP,
      grossProfitMarginPercent,
      totalJobs,
      averageRevenuePerJob,
      averageCostPerJob,
      averageProfitPerJob,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Analyze profitability for all services
   */
  async analyzeAllServicesProfitability(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceProfitability[]> {
    const services = await prisma.service.findMany({
      where: { tenantId }
    });

    return await Promise.all(
      services.map(service =>
        this.analyzeServiceProfitability(tenantId, service.id, startDate, endDate)
      )
    );
  }

  /**
   * Compare service profitability between periods
   */
  async compareServiceProfitability(
    tenantId: string,
    serviceId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<ServiceComparison> {
    const [currentPeriod, previousPeriod] = await Promise.all([
      this.analyzeServiceProfitability(tenantId, serviceId, currentStart, currentEnd),
      this.analyzeServiceProfitability(tenantId, serviceId, previousStart, previousEnd)
    ]);

    const revenueChangePercent = previousPeriod.totalRevenueSYP > 0
      ? ((currentPeriod.totalRevenueSYP - previousPeriod.totalRevenueSYP) / previousPeriod.totalRevenueSYP) * 100
      : 0;
    const profitChangePercent = previousPeriod.grossProfitSYP > 0
      ? ((currentPeriod.grossProfitSYP - previousPeriod.grossProfitSYP) / Math.abs(previousPeriod.grossProfitSYP)) * 100
      : 0;
    const marginChangePercent = currentPeriod.grossProfitMarginPercent - previousPeriod.grossProfitMarginPercent;

    return {
      serviceId,
      serviceName: currentPeriod.serviceName,
      currentPeriod,
      previousPeriod,
      revenueChangePercent,
      profitChangePercent,
      marginChangePercent
    };
  }

  /**
   * Get most profitable services
   */
  async getMostProfitableServices(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<ServiceProfitability[]> {
    const profitability = await this.analyzeAllServicesProfitability(tenantId, startDate, endDate);

    return profitability
      .sort((a, b) => b.grossProfitSYP - a.grossProfitSYP)
      .slice(0, limit);
  }

  /**
   * Get least profitable services
   */
  async getLeastProfitableServices(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<ServiceProfitability[]> {
    const profitability = await this.analyzeAllServicesProfitability(tenantId, startDate, endDate);

    return profitability
      .sort((a, b) => a.grossProfitSYP - b.grossProfitSYP)
      .slice(0, limit);
  }

  /**
   * Get services with highest margin
   */
  async getHighestMarginServices(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<ServiceProfitability[]> {
    const profitability = await this.analyzeAllServicesProfitability(tenantId, startDate, endDate);

    return profitability
      .sort((a, b) => b.grossProfitMarginPercent - a.grossProfitMarginPercent)
      .slice(0, limit);
  }

  /**
   * Get services with lowest margin
   */
  async getLowestMarginServices(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<ServiceProfitability[]> {
    const profitability = await this.analyzeAllServicesProfitability(tenantId, startDate, endDate);

    return profitability
      .sort((a, b) => a.grossProfitMarginPercent - b.grossProfitMarginPercent)
      .slice(0, limit);
  }

  /**
   * Get service profitability summary
   */
  async getProfitabilitySummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalServices: number;
    profitableServices: number;
    unprofitableServices: number;
    totalRevenueSYP: number;
    totalCostSYP: number;
    totalProfitSYP: number;
    averageMarginPercent: number;
    mostProfitableService: ServiceProfitability | null;
    leastProfitableService: ServiceProfitability | null;
  }> {
    const profitability = await this.analyzeAllServicesProfitability(tenantId, startDate, endDate);

    const profitableServices = profitability.filter(s => s.grossProfitSYP > 0).length;
    const unprofitableServices = profitability.filter(s => s.grossProfitSYP < 0).length;
    const totalRevenueSYP = profitability.reduce((sum, s) => sum + s.totalRevenueSYP, 0);
    const totalCostSYP = profitability.reduce((sum, s) => sum + s.totalCostSYP, 0);
    const totalProfitSYP = totalRevenueSYP - totalCostSYP;
    const averageMarginPercent = totalRevenueSYP > 0 ? (totalProfitSYP / totalRevenueSYP) * 100 : 0;

    const mostProfitableService = profitability.length > 0
      ? profitability.reduce((max, s) => s.grossProfitSYP > max.grossProfitSYP ? s : max)
      : null;
    const leastProfitableService = profitability.length > 0
      ? profitability.reduce((min, s) => s.grossProfitSYP < min.grossProfitSYP ? s : min)
      : null;

    return {
      totalServices: profitability.length,
      profitableServices,
      unprofitableServices,
      totalRevenueSYP,
      totalCostSYP,
      totalProfitSYP,
      averageMarginPercent,
      mostProfitableService,
      leastProfitableService
    };
  }

  /**
   * Get service profitability trend
   */
  async getProfitabilityTrend(
    tenantId: string,
    serviceId: string,
    periods: Array<{ start: Date; end: Date }>
  ): Promise<{
    serviceId: string;
    serviceName: string;
    periodData: Array<{
      period: string;
      serviceName: string;
      revenueSYP: number;
      costSYP: number;
      profitSYP: number;
      marginPercent: number;
      jobs: number;
    }>;
    trend: {
      revenueTrend: number[];
      profitTrend: number[];
      marginTrend: number[];
    };
  }> {
    const periodData = await Promise.all(
      periods.map(async (period) => {
        const profitability = await this.analyzeServiceProfitability(
          tenantId,
          serviceId,
          period.start,
          period.end
        );

        return {
          period: `${period.start.toISOString().split('T')[0]} - ${period.end.toISOString().split('T')[0]}`,
          serviceName: profitability.serviceName,
          revenueSYP: profitability.totalRevenueSYP,
          costSYP: profitability.totalCostSYP,
          profitSYP: profitability.grossProfitSYP,
          marginPercent: profitability.grossProfitMarginPercent,
          jobs: profitability.totalJobs
        };
      })
    );

    return {
      serviceId,
      serviceName: periodData[0]?.serviceName || '',
      periodData,
      trend: {
        revenueTrend: periodData.map(p => p.revenueSYP),
        profitTrend: periodData.map(p => p.profitSYP),
        marginTrend: periodData.map(p => p.marginPercent)
      }
    };
  }
}

export default new ServiceProfitabilityService();
