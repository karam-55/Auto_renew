import prisma from '../../config/database';

export class VehicleAnalyticsService {
  async getVehicleStats(tenantId: string) {
    const totalVehicles = await prisma.vehicle.count({
      where: { tenantId },
    });

    const vehiclesByMake = await prisma.vehicle.groupBy({
      by: ['make'],
      where: { tenantId },
      _count: true,
    });

    const vehiclesByYear = await prisma.vehicle.groupBy({
      by: ['year'],
      where: { tenantId },
      _count: true,
      orderBy: { year: 'desc' },
    });

    const averageMileage = await prisma.vehicle.aggregate({
      where: { tenantId, currentKm: { not: null } },
      _avg: { currentKm: true },
    });

    const faultStats = await prisma.vehicleFault.groupBy({
      by: ['severity', 'status'],
      where: {
        vehicle: { tenantId },
      },
      _count: true,
    });

    const openFaults = await prisma.vehicleFault.count({
      where: {
        vehicle: { tenantId },
        status: 'OPEN',
      },
    });

    const pendingRecommendations = await prisma.vehicleRecommendation.count({
      where: {
        vehicle: { tenantId },
        status: 'PENDING',
      },
    });

    return {
      totalVehicles,
      vehiclesByMake: vehiclesByMake.map((item) => ({
        make: item.make,
        count: item._count,
      })),
      vehiclesByYear: vehiclesByYear.map((item) => ({
        year: item.year,
        count: item._count,
      })),
      averageMileage: averageMileage._avg.currentKm || 0,
      faultStats: faultStats.map((item) => ({
        severity: item.severity,
        status: item.status,
        count: item._count,
      })),
      openFaults,
      pendingRecommendations,
    };
  }

  async getVehicleHistoryStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historyByType = await prisma.vehicleHistory.groupBy({
      by: ['type'],
      where: {
        vehicle: { tenantId },
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const recentServices = await prisma.vehicleHistory.count({
      where: {
        vehicle: { tenantId },
        type: 'SERVICE',
        createdAt: { gte: startDate },
      },
    });

    return {
      historyByType: historyByType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
      recentServices,
    };
  }
}
