import prisma from '../config/database';

interface DateRange {
  dateFrom: Date;
  dateTo: Date;
}

interface SalesAnalytics {
  totalSales: number;
  salesByDay: { date: string; amount: number }[];
  salesByService: { serviceName: string; amount: number }[];
  topCustomers: { customerName: string; totalSpent: number }[];
  averageInvoiceValue: number;
}

interface ProfitabilityAnalytics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  profitByService: { serviceName: string; profit: number }[];
}

interface BookingAnalytics {
  totalBookings: number;
  bookingsByStatus: { status: string; count: number }[];
  bookingsByDay: { date: string; count: number }[];
  technicianUtilization: { technicianName: string; utilization: number }[];
}

interface InventoryAnalytics {
  inventoryValue: number;
  lowStockItems: { itemName: string; currentStock: number; minStock: number }[];
  stockMovements: { type: 'IN' | 'OUT'; count: number }[];
  topUsedParts: { partName: string; usageCount: number }[];
}

interface MembershipAnalytics {
  activeMemberships: number;
  expiredMemberships: number;
  newMemberships: number;
  membershipRevenue: number;
}

interface BranchComparison {
  branchId: string;
  branchName: string;
  sales: number;
  profit: number;
  inventoryValue: number;
  activeMemberships: number;
}

// Simple in-memory cache for analytics
const analyticsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class AnalyticsService {
  private getCacheKey(method: string, branchId: string, dateRange: DateRange): string {
    return `${method}:${branchId}:${dateRange.dateFrom.toISOString()}:${dateRange.dateTo.toISOString()}`;
  }

  private getFromCache(key: string): any | null {
    const cached = analyticsCache.get(key);
    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      // Delete expired entry to prevent memory leak
      analyticsCache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    analyticsCache.set(key, { data, timestamp: Date.now() });
    // Clean up expired entries if cache grows too large
    if (analyticsCache.size > 1000) {
      this.cleanExpiredCache();
    }
  }

  /**
   * Clean up expired cache entries to prevent memory leak
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of analyticsCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        analyticsCache.delete(key);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    analyticsCache.clear();
  }

  /**
   * Get sales analytics
   */
  async getSalesAnalytics(tenantId: string, branchId: string | 'all', dateRange: DateRange): Promise<SalesAnalytics> {
    const cacheKey = this.getCacheKey('sales', branchId, dateRange);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: dateRange.dateFrom,
        lte: dateRange.dateTo,
      },
    };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    // Get all invoices
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            service: true,
          },
        },
        customer: true,
      },
    });

    // Calculate total sales
    const totalSales = invoices.reduce((sum: number, inv) => sum + Number(inv.totalSYP || 0), 0);

    // Sales by day
    const salesByDayMap = new Map<string, number>();
    invoices.forEach(inv => {
      const date = inv.createdAt.toISOString().split('T')[0];
      salesByDayMap.set(date, (salesByDayMap.get(date) || 0) + Number(inv.totalSYP || 0));
    });
    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, amount]) => ({ date, amount }));

    // Sales by service
    const salesByServiceMap = new Map<string, number>();
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const serviceName = item.service?.name || 'Unknown';
        const amount = Number(item.quantity) * Number(item.priceSYP);
        salesByServiceMap.set(serviceName, (salesByServiceMap.get(serviceName) || 0) + amount);
      });
    });
    const salesByService = Array.from(salesByServiceMap.entries())
      .map(([serviceName, amount]) => ({ serviceName, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Top customers
    const customerSalesMap = new Map<string, number>();
    invoices.forEach(inv => {
      const customerName = inv.customer?.fullName || 'Unknown';
      customerSalesMap.set(customerName, (customerSalesMap.get(customerName) || 0) + Number(inv.totalSYP || 0));
    });
    const topCustomers = Array.from(customerSalesMap.entries())
      .map(([customerName, totalSpent]) => ({ customerName, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Average invoice value
    const averageInvoiceValue = invoices.length > 0 ? totalSales / invoices.length : 0;

    const result: SalesAnalytics = {
      totalSales,
      salesByDay,
      salesByService,
      topCustomers,
      averageInvoiceValue,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get profitability analytics
   */
  async getProfitabilityAnalytics(tenantId: string, branchId: string | 'all', dateRange: DateRange): Promise<ProfitabilityAnalytics> {
    const cacheKey = this.getCacheKey('profitability', branchId, dateRange);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: dateRange.dateFrom,
        lte: dateRange.dateTo,
      },
    };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            service: true,
            part: true,
          },
        },
      },
    });

    // Calculate revenue and cost
    let totalRevenue = 0;
    let totalCost = 0;
    const profitByServiceMap = new Map<string, number>();

    invoices.forEach(inv => {
      const revenue = Number(inv.totalSYP || 0);
      totalRevenue += revenue;

      let cost = 0;
      inv.items.forEach(item => {
        const serviceName = item.service?.name || 'Unknown';
        // Use part cost or service cost
        const itemCost = Number(item.quantity) * (Number(item.part?.costSYP) || 0);
        cost += itemCost;
        profitByServiceMap.set(serviceName, (profitByServiceMap.get(serviceName) || 0) + (revenue * (Number(item.quantity) / inv.items.reduce((sum: number, i) => sum + Number(i.quantity), 0)) - itemCost));
      });
      totalCost += cost;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const profitByService = Array.from(profitByServiceMap.entries())
      .map(([serviceName, profit]) => ({ serviceName, profit }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    const result: ProfitabilityAnalytics = {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      profitByService,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(tenantId: string, branchId: string | 'all', dateRange: DateRange): Promise<BookingAnalytics> {
    const cacheKey = this.getCacheKey('bookings', branchId, dateRange);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: dateRange.dateFrom,
        lte: dateRange.dateTo,
      },
    };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        mechanicAssignments: {
          include: {
            mechanic: true,
          },
        },
      },
    });

    const totalBookings = bookings.length;

    // Bookings by status
    const bookingsByStatusMap = new Map<string, number>();
    bookings.forEach(b => {
      const status = b.status || 'UNKNOWN';
      bookingsByStatusMap.set(status, (bookingsByStatusMap.get(status) || 0) + 1);
    });
    const bookingsByStatus = Array.from(bookingsByStatusMap.entries()).map(([status, count]) => ({ status, count }));

    // Bookings by day
    const bookingsByDayMap = new Map<string, number>();
    bookings.forEach(b => {
      const date = b.createdAt.toISOString().split('T')[0];
      bookingsByDayMap.set(date, (bookingsByDayMap.get(date) || 0) + 1);
    });
    const bookingsByDay = Array.from(bookingsByDayMap.entries()).map(([date, count]) => ({ date, count }));

    // Technician utilization
    const technicianBookingsMap = new Map<string, number>();
    bookings.forEach((b: any) => {
      if (b.mechanicAssignments && b.mechanicAssignments.length > 0) {
        b.mechanicAssignments.forEach((ma: any) => {
          const techName = ma.mechanic?.fullName || 'Unknown';
          technicianBookingsMap.set(techName, (technicianBookingsMap.get(techName) || 0) + 1);
        });
      }
    });
    const maxBookings = Math.max(...Array.from(technicianBookingsMap.values()), 1);
    const technicianUtilization = Array.from(technicianBookingsMap.entries())
      .map(([technicianName, count]) => ({
        technicianName,
        utilization: (count / maxBookings) * 100,
      }))
      .sort((a, b) => b.utilization - a.utilization);

    const result: BookingAnalytics = {
      totalBookings,
      bookingsByStatus,
      bookingsByDay,
      technicianUtilization,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get inventory analytics
   */
  async getInventoryAnalytics(tenantId: string, branchId: string | 'all'): Promise<InventoryAnalytics> {
    const cacheKey = this.getCacheKey('inventory', branchId, { dateFrom: new Date(), dateTo: new Date() });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const whereClause: any = { tenantId };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    const parts = await prisma.part.findMany({
      where: whereClause,
    });

    // Calculate inventory value
    const inventoryValue = parts.reduce((sum: number, item) => {
      return sum + (Number(item.quantity) * Number(item.costSYP || 0));
    }, 0);

    // Low stock items
    const lowStockItems = parts
      .filter(item => item.quantity <= (item.minQuantity || 0))
      .map(item => ({
        itemName: item.name,
        currentStock: item.quantity,
        minStock: item.minQuantity || 0,
      }));

    // Stock movements
    const stockMovements = await prisma.inventoryTransaction.findMany({
      where: whereClause,
    });

    const movementsCount = stockMovements.reduce(
      (acc: { IN: number; OUT: number }, mov: any) => {
        if (mov.type === 'IN') acc.IN++;
        else acc.OUT++;
        return acc;
      },
      { IN: 0, OUT: 0 }
    );

    const stockMovementsResult = [
      { type: 'IN' as const, count: movementsCount.IN },
      { type: 'OUT' as const, count: movementsCount.OUT },
    ];

    // Top used parts (from stock movements)
    const partUsageMap = new Map<string, number>();
    stockMovements.forEach((mov: any) => {
      if (mov.type === 'OUT') {
        const part = mov.part as any;
        const partName = part?.name || 'Unknown';
        partUsageMap.set(partName, (partUsageMap.get(partName) || 0) + Number(mov.quantity));
      }
    });
    const topUsedParts = Array.from(partUsageMap.entries())
      .map(([partName, usageCount]) => ({ partName, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const result: InventoryAnalytics = {
      inventoryValue,
      lowStockItems,
      stockMovements: stockMovementsResult,
      topUsedParts,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get membership analytics
   */
  async getMembershipAnalytics(tenantId: string, branchId: string | 'all', dateRange: DateRange): Promise<MembershipAnalytics> {
    const cacheKey = this.getCacheKey('memberships', branchId, dateRange);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const whereClause: any = { tenantId };

    if (branchId !== 'all') {
      whereClause.branchId = branchId;
    }

    // Active memberships
    const activeMemberships = await prisma.customerMembership.count({
      where: {
        ...whereClause,
        status: 'ACTIVE',
      },
    });

    // Expired memberships
    const expiredMemberships = await prisma.customerMembership.count({
      where: {
        ...whereClause,
        status: 'EXPIRED',
      },
    });

    // New memberships in date range
    const newMemberships = await prisma.customerMembership.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: dateRange.dateFrom,
          lte: dateRange.dateTo,
        },
      },
    });

    // Membership revenue in date range
    const memberships = await prisma.customerMembership.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: dateRange.dateFrom,
          lte: dateRange.dateTo,
        },
      },
      include: {
        membershipPlan: true,
      },
    });

    const membershipRevenue = memberships.reduce((sum: number, m: any) => {
      return sum + Number(m.membershipPlan?.price || 0);
    }, 0);

    const result: MembershipAnalytics = {
      activeMemberships,
      expiredMemberships,
      newMemberships,
      membershipRevenue,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get branch comparison (admin only)
   */
  async getBranchComparison(tenantId: string, dateRange: DateRange): Promise<BranchComparison[]> {
    const cacheKey = this.getCacheKey('branchComparison', 'all', dateRange);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const branches = await prisma.branch.findMany({
      where: { tenantId },
    });

    const comparisons: BranchComparison[] = [];

    for (const branch of branches) {
      const [sales, profit, inventory, memberships] = await Promise.all([
        this.getSalesAnalytics(tenantId, branch.id, dateRange),
        this.getProfitabilityAnalytics(tenantId, branch.id, dateRange),
        this.getInventoryAnalytics(tenantId, branch.id),
        this.getMembershipAnalytics(tenantId, branch.id, dateRange),
      ]);

      comparisons.push({
        branchId: branch.id,
        branchName: branch.name,
        sales: sales.totalSales,
        profit: profit.totalProfit,
        inventoryValue: inventory.inventoryValue,
        activeMemberships: memberships.activeMemberships,
      });
    }

    this.setCache(cacheKey, comparisons);
    return comparisons;
  }
}

export default new AnalyticsService();
