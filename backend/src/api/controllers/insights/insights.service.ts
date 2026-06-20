import prisma from '../../../config/database';

export class InsightsService {
  async getInsights(tenantId: string) {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Get financial data for current month
    const currentInvoices = await prisma.invoice.findMany({
      where: { tenantId, createdAt: { gte: lastMonthStart } },
      include: { payments: true },
    });

    const currentRevenue = currentInvoices.reduce((sum: number, inv: any) => {
      const paid = inv.payments.reduce((pSum: number, p: any) => pSum + Number(p.amountSYP || 0), 0);
      return sum + paid;
    }, 0);

    // Get financial data for previous month
    const previousInvoices = await prisma.invoice.findMany({
      where: { tenantId, createdAt: { gte: twoMonthsAgoStart, lte: lastMonthEnd } },
      include: { payments: true },
    });

    const previousRevenue = previousInvoices.reduce((sum: number, inv: any) => {
      const paid = inv.payments.reduce((pSum: number, p: any) => pSum + Number(p.amountSYP || 0), 0);
      return sum + paid;
    }, 0);

    // Calculate revenue trend
    let revenueTrend = 'stable';
    let revenueChange = 0;
    if (previousRevenue > 0) {
      revenueChange = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
      revenueTrend = revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'stable';
    } else if (currentRevenue > 0) {
      revenueChange = 100;
      revenueTrend = 'up';
    }

    // Calculate profit (revenue - expenses)
    const currentExpenses = await prisma.expense.findMany({
      where: { tenantId, createdAt: { gte: lastMonthStart } },
    });
    const previousExpenses = await prisma.expense.findMany({
      where: { tenantId, createdAt: { gte: twoMonthsAgoStart, lte: lastMonthEnd } },
    });

    const currentProfit = currentRevenue - currentExpenses.reduce((s: number, e: any) => s + Number(e.amountSYP || 0), 0);
    const previousProfit = previousRevenue - previousExpenses.reduce((s: number, e: any) => s + Number(e.amountSYP || 0), 0);

    let profitTrend = 'stable';
    let profitChange = 0;
    if (previousProfit > 0) {
      profitChange = Math.round(((currentProfit - previousProfit) / previousProfit) * 100);
      profitTrend = profitChange > 5 ? 'up' : profitChange < -5 ? 'down' : 'stable';
    } else if (currentProfit > 0) {
      profitChange = 100;
      profitTrend = 'up';
    }

    // Get overdue invoices for receivables risk
    const overdueInvoices = await prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ['DRAFT', 'SENT'] },
        dueDate: { lt: now },
      },
    });

    // Get operational data
    const currentBookings = await prisma.booking.count({
      where: { tenantId, createdAt: { gte: lastMonthStart } },
    });
    const previousBookings = await prisma.booking.count({
      where: { tenantId, createdAt: { gte: twoMonthsAgoStart, lte: lastMonthEnd } },
    });

    let bookingTrend = 'stable';
    let bookingChange = 0;
    if (previousBookings > 0) {
      bookingChange = Math.round(((currentBookings - previousBookings) / previousBookings) * 100);
      bookingTrend = bookingChange > 5 ? 'up' : bookingChange < -5 ? 'down' : 'stable';
    }

    // Get inventory data
    const inventoryItems = await prisma.part.findMany({
      where: { tenantId },
    });
    const lowStockItems = inventoryItems.filter((item: any) => Number(item.quantity) < 10);

    // Get top services from invoice items
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { invoice: { tenantId, createdAt: { gte: lastMonthStart } } },
      include: { service: true },
    });
    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const item of invoiceItems) {
      if (item.serviceId && item.service) {
        const existing = serviceMap.get(item.serviceId);
        if (existing) {
          existing.count += 1;
          existing.revenue += Number(item.totalSYP || 0);
        } else {
          serviceMap.set(item.serviceId, {
            name: item.service.nameAr || item.service.nameEn || 'Unknown',
            count: 1,
            revenue: Number(item.totalSYP || 0),
          });
        }
      }
    }
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Build insights response
    return {
      financial: {
        revenueTrend,
        revenueChange,
        profitTrend,
        profitChange,
        cashflowRisk: overdueInvoices > 10 ? 'high' : overdueInvoices > 5 ? 'medium' : 'low',
        receivablesRisk: overdueInvoices > 10 ? 'high' : overdueInvoices > 5 ? 'medium' : 'low',
      },
      operational: {
        bookingTrend,
        bookingChange,
        inventoryRisk: lowStockItems.length > 5 ? 'high' : lowStockItems.length > 2 ? 'medium' : 'low',
        topServices,
      },
      recommendations: [
        {
          message: lowStockItems.length > 0 ? `${lowStockItems.length} items are low on stock` : 'Inventory levels are healthy',
          importance: lowStockItems.length > 5 ? 'high' : 'medium',
          type: 'inventory',
        },
        {
          message: overdueInvoices > 5 ? `${overdueInvoices} overdue invoices - follow up needed` : 'Receivables are under control',
          importance: overdueInvoices > 10 ? 'high' : overdueInvoices > 5 ? 'medium' : 'low',
          type: 'finance',
        },
      ],
      predictive: {
        predictedRevenue: currentRevenue > 0 ? Math.round(currentRevenue * (1 + revenueChange / 100)) : 0,
        predictedBookings: currentBookings > 0 ? Math.round(currentBookings * (1 + bookingChange / 100)) : 0,
        lowStockPredictions: lowStockItems.map((item: any) => item.name),
      },
    };
  }
}
