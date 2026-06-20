import prisma from '../../config/database';
import {
  ReportFilters,
  SalesReport,
  InventoryReport,
  PerformanceReport,
  FinancialReport,
  CustomerInsightsReport,
  ServiceRevenue,
  MonthlyRevenue,
  CustomerRevenue,
  LowStockItem,
  FastMovingItem,
  SlowMovingItem,
  WarehouseInventory,
  MechanicPerformance,
  ServicePerformance,
  PaymentMethodRevenue,
  ExpenseCategory,
  CashFlowEntry,
  CustomerSegment,
  ChurnRiskCustomer
} from './types';

export class AdvancedReportsService {
  // ============================================
  // SALES REPORTS
  // ============================================

  async getRevenueReport(tenantId: string, filters: ReportFilters = {}): Promise<SalesReport> {
    const { dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true } },
        items: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    let totalRevenueSYP = 0;
    let totalRevenueUSD = 0;

    invoices.forEach(invoice => {
      totalRevenueSYP += Number(invoice.totalSYP) || 0;
      totalRevenueUSD += Number(invoice.totalUSD) || 0;
    });

    const totalInvoices = invoices.length;
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenueSYP / totalInvoices : 0;

    // Revenue by service (using invoice items)
    const serviceRevenueMap = new Map<string, ServiceRevenue>();

    // Revenue by month
    const monthlyRevenueMap = new Map<string, MonthlyRevenue>();

    // Top customers
    const customerRevenueMap = new Map<string, CustomerRevenue>();

    invoices.forEach(invoice => {
      // Monthly revenue
      const monthKey = `${invoice.createdAt.getFullYear()}-${String(invoice.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existingMonth = monthlyRevenueMap.get(monthKey) || {
        month: monthKey,
        year: invoice.createdAt.getFullYear(),
        revenueSYP: 0,
        revenueUSD: 0,
        invoiceCount: 0,
      };

      existingMonth.revenueSYP += Number(invoice.totalSYP) || 0;
      existingMonth.revenueUSD += Number(invoice.totalUSD) || 0;
      existingMonth.invoiceCount++;

      monthlyRevenueMap.set(monthKey, existingMonth);

      // Service revenue
      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
          const sid = item.serviceId || 'other';
          const sname = item.service?.name || item.description || 'غير محدد';
          const existingService = serviceRevenueMap.get(sid) || {
            serviceId: sid,
            serviceName: sname,
            totalRevenueSYP: 0,
            totalRevenueUSD: 0,
            invoiceCount: 0,
          };
          existingService.totalRevenueSYP += Number(item.priceSYP) || 0;
          existingService.totalRevenueUSD += Number(item.priceUSD) || 0;
          existingService.invoiceCount++;
          serviceRevenueMap.set(sid, existingService);
        });
      }

      // Customer revenue
      if (invoice.customerId) {
        const existingCustomer = customerRevenueMap.get(invoice.customerId) || {
          customerId: invoice.customerId,
          customerName: invoice.customer?.fullName || '',
          totalRevenueSYP: 0,
          totalRevenueUSD: 0,
          invoiceCount: 0,
        };

        existingCustomer.totalRevenueSYP += Number(invoice.totalSYP) || 0;
        existingCustomer.totalRevenueUSD += Number(invoice.totalUSD) || 0;
        existingCustomer.invoiceCount++;
        if (invoice.customer?.fullName) existingCustomer.customerName = invoice.customer.fullName;

        customerRevenueMap.set(invoice.customerId, existingCustomer);
      }
    });

    return {
      totalRevenueSYP,
      totalRevenueUSD,
      totalInvoices,
      averageInvoiceValue,
      revenueByService: Array.from(serviceRevenueMap.values()),
      revenueByMonth: Array.from(monthlyRevenueMap.values()),
      topCustomers: Array.from(customerRevenueMap.values())
        .sort((a, b) => b.totalRevenueSYP - a.totalRevenueSYP)
        .slice(0, 10),
    };
  }

  async getSalesReport(tenantId: string, filters: ReportFilters = {}): Promise<SalesReport> {
    const { dateFrom, dateTo, customerId } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            part: true,
          },
        },
        customer: true,
      },
    });

    // Calculate total revenue
    let totalRevenueSYP = 0;
    let totalRevenueUSD = 0;

    invoices.forEach(invoice => {
      totalRevenueSYP += Number(invoice.totalSYP) || 0;
      totalRevenueUSD += Number(invoice.totalUSD) || 0;
    });

    // Revenue by part (instead of service)
    const partRevenueMap = new Map<string, ServiceRevenue>();

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const partId = item.partId || 'unknown';
        const existing = partRevenueMap.get(partId) || {
          serviceId: partId,
          serviceName: item.part?.name || item.description,
          totalRevenueSYP: 0,
          totalRevenueUSD: 0,
          invoiceCount: 0,
        };

        existing.totalRevenueSYP += Number(item.priceSYP) || 0;
        existing.totalRevenueUSD += Number(item.priceUSD) || 0;
        existing.invoiceCount++;

        partRevenueMap.set(partId, existing);
      });
    });

    // Revenue by month
    const monthlyRevenueMap = new Map<string, MonthlyRevenue>();

    invoices.forEach(invoice => {
      const month = invoice.createdAt.getMonth();
      const year = invoice.createdAt.getFullYear();
      const key = `${year}-${month}`;

      const existing = monthlyRevenueMap.get(key) || {
        month: invoice.createdAt.toLocaleString('default', { month: 'long' }),
        year,
        revenueSYP: 0,
        revenueUSD: 0,
        invoiceCount: 0,
      };

      existing.revenueSYP += Number(invoice.totalSYP) || 0;
      existing.revenueUSD += Number(invoice.totalUSD) || 0;
      existing.invoiceCount++;

      monthlyRevenueMap.set(key, existing);
    });

    // Top customers
    const customerRevenueMap = new Map<string, CustomerRevenue>();

    invoices.forEach(invoice => {
      if (!invoice.customerId) return;
      const customerId = invoice.customerId;
      const existing = customerRevenueMap.get(customerId) || {
        customerId,
        customerName: invoice.customer?.fullName || 'Unknown',
        totalRevenueSYP: 0,
        totalRevenueUSD: 0,
        invoiceCount: 0,
      };

      existing.totalRevenueSYP += Number(invoice.totalSYP) || 0;
      existing.totalRevenueUSD += Number(invoice.totalUSD) || 0;
      existing.invoiceCount++;

      customerRevenueMap.set(customerId, existing);
    });

    return {
      totalRevenueSYP,
      totalRevenueUSD,
      totalInvoices: invoices.length,
      averageInvoiceValue: invoices.length > 0 ? totalRevenueSYP / invoices.length : 0,
      revenueByService: Array.from(partRevenueMap.values()),
      revenueByMonth: Array.from(monthlyRevenueMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month.localeCompare(b.month);
      }),
      topCustomers: Array.from(customerRevenueMap.values())
        .sort((a, b) => b.totalRevenueSYP - a.totalRevenueSYP)
        .slice(0, 10),
    };
  }

  // ============================================
  // INVENTORY REPORTS
  // ============================================

  async getInventoryReport(tenantId: string, filters: ReportFilters = {}): Promise<InventoryReport> {
    const where: any = { tenantId };

    // Get all parts with their quantities
    const parts = await prisma.part.findMany({
      where,
      include: {
        category: true,
        supplier: true,
      },
    });

    // Calculate totals
    let totalParts = 0;
    let totalValueSYP = 0;
    let totalValueUSD = 0;

    const lowStockItems: LowStockItem[] = [];

    parts.forEach(part => {
      totalParts += part.quantity;
      totalValueSYP += Number(part.quantity) * Number(part.costSYP);
      totalValueUSD += Number(part.quantity) * (Number(part.costUSD) || 0);

      // Check for low stock
      if (part.quantity <= part.minQuantity) {
        lowStockItems.push({
          partId: part.id,
          partName: part.name,
          partCode: part.partNumber,
          currentQuantity: part.quantity,
          minQuantity: part.minQuantity,
          reorderLevel: part.minQuantity, // Using minQuantity as reorder level
          unitCostSYP: Number(part.costSYP),
        });
      }
    });

    // Fast moving items (based on recent sales)
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    const fastMovingMap = new Map<string, FastMovingItem>();

    recentInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!item.partId) return;
        
        const existing = fastMovingMap.get(item.partId) || {
          partId: item.partId,
          partName: item.part?.name || item.description,
          partCode: item.part?.partNumber || '',
          totalSold: 0,
          totalRevenueSYP: 0,
          turnoverRate: 0,
        };

        existing.totalSold += item.quantity;
        existing.totalRevenueSYP += Number(item.priceSYP) || 0;

        fastMovingMap.set(item.partId, existing);
      });
    });

    // Calculate turnover rate using average inventory formula:
    // turnover = totalSold / ((beginningStock + currentStock) / 2)
    const fastMovingItems = Array.from(fastMovingMap.values())
      .map(item => {
        const part = parts.find(p => p.id === item.partId);
        const currentStock = part ? part.quantity : 0;
        const beginningStock = currentStock + item.totalSold;
        const avgStock = beginningStock > 0 ? (beginningStock + currentStock) / 2 : 1;
        return {
          ...item,
          turnoverRate: avgStock > 0 ? (item.totalSold / avgStock) * 100 : 0,
        };
      })
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 10);

    // Slow moving items (simplified - parts with no recent sales)
    const slowMovingItems: SlowMovingItem[] = [];

    // For now, just mark items with zero quantity as slow moving
    parts.forEach(part => {
      if (part.quantity === 0) {
        slowMovingItems.push({
          partId: part.id,
          partName: part.name,
          partCode: part.partNumber,
          currentQuantity: part.quantity,
          lastSoldDate: new Date(0),
          daysSinceLastSale: 999,
          currentValueSYP: 0,
        });
      }
    });

    // Warehouse inventory (simplified since we don't have warehouse-part mapping)
    const warehouseInventory: WarehouseInventory[] = [];

    return {
      totalParts,
      totalValueSYP,
      totalValueUSD,
      lowStockItems,
      fastMovingItems,
      slowMovingItems: slowMovingItems.slice(0, 10),
      inventoryByWarehouse: warehouseInventory,
    };
  }

  // ============================================
  // PERFORMANCE REPORTS
  // ============================================

  async getMechanicPerformanceReport(tenantId: string, filters: ReportFilters = {}): Promise<PerformanceReport> {
    const { dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get bookings with mechanic assignments
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        mechanicAssignments: {
          include: {
            mechanic: true,
          },
        },
        invoices: true,
      },
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate average service time
    const completedWithTimes = bookings.filter(b => 
      b.status === 'COMPLETED' && b.actualCompletionDate && b.createdAt
    );
    
    let totalServiceTime = 0;
    completedWithTimes.forEach(booking => {
      const startTime = booking.createdAt.getTime();
      const endTime = booking.actualCompletionDate!.getTime();
      totalServiceTime += (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
    });

    const averageServiceTime = completedWithTimes.length > 0 
      ? totalServiceTime / completedWithTimes.length 
      : 0;

    // Mechanic performance
    const mechanicPerformanceMap = new Map<string, MechanicPerformance>();

    bookings.forEach(booking => {
      if (!booking.mechanicAssignments || !Array.isArray(booking.mechanicAssignments)) return;
      
      booking.mechanicAssignments.forEach((ma: any) => {
        const mechanicId = ma.mechanicUserId;
        const mechanicName = ma.mechanic.fullName;

        const existing = mechanicPerformanceMap.get(mechanicId) || {
          mechanicId,
          mechanicName,
          totalAssignments: 0,
          completedAssignments: 0,
          completionRate: 0,
          averageTime: 0,
          totalRevenueSYP: 0,
        };

        existing.totalAssignments++;

        if (booking.status === 'COMPLETED') {
          existing.completedAssignments++;
        }

        // Calculate revenue from invoices
        if (booking.invoices) {
          booking.invoices.forEach(invoice => {
            existing.totalRevenueSYP += Number(invoice.totalSYP) || 0;
          });
        }

        mechanicPerformanceMap.set(mechanicId, existing);
      });
    });

    const mechanicPerformance = Array.from(mechanicPerformanceMap.values()).map(mp => ({
      ...mp,
      completionRate: mp.totalAssignments > 0 ? (mp.completedAssignments / mp.totalAssignments) * 100 : 0,
    }));

    // Service performance (simplified)
    const servicePerformance: ServicePerformance[] = [];

    return {
      totalBookings,
      completedBookings,
      completionRate,
      averageServiceTime,
      mechanicPerformance,
      servicePerformance,
    };
  }

  async getPerformanceReport(tenantId: string, filters: ReportFilters = {}): Promise<PerformanceReport> {
    const { dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const bookings = await prisma.booking.findMany({
      where,
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate average service time
    const completedWithTimes = bookings.filter(b => 
      b.status === 'COMPLETED' && b.actualCompletionDate && b.createdAt
    );
    
    let totalServiceTime = 0;
    completedWithTimes.forEach(booking => {
      const startTime = booking.createdAt.getTime();
      const endTime = booking.actualCompletionDate!.getTime();
      totalServiceTime += (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
    });

    const averageServiceTime = completedWithTimes.length > 0 
      ? totalServiceTime / completedWithTimes.length 
      : 0;

    // Simplified performance metrics
    const mechanicPerformance: MechanicPerformance[] = [];
    const servicePerformance: ServicePerformance[] = [];

    return {
      totalBookings,
      completedBookings,
      completionRate,
      averageServiceTime,
      mechanicPerformance,
      servicePerformance,
    };
  }

  // ============================================
  // FINANCIAL REPORTS
  // ============================================

  async getFinancialReport(tenantId: string, filters: ReportFilters = {}): Promise<FinancialReport> {
    const { dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get revenue from invoices with payments
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: true,
      },
    });

    let totalRevenueSYP = 0;
    let totalRevenueUSD = 0;

    invoices.forEach(invoice => {
      totalRevenueSYP += Number(invoice.totalSYP) || 0;
      totalRevenueUSD += Number(invoice.totalUSD) || 0;
    });

    // Simplified financial report (expense calculation would need proper accounting setup)
    const totalExpensesSYP = 0;
    const totalExpensesUSD = 0;

    const netProfitSYP = totalRevenueSYP - totalExpensesSYP;
    const netProfitUSD = totalRevenueUSD - totalExpensesUSD;
    const profitMargin = totalRevenueSYP > 0 ? (netProfitSYP / totalRevenueSYP) * 100 : 0;

    // Revenue by payment method
    const paymentMethodMap = new Map<string, PaymentMethodRevenue>();

    invoices.forEach(invoice => {
      invoice.payments.forEach(payment => {
        const method = payment.paymentMethod || 'CASH';
        const existing = paymentMethodMap.get(method) || {
          paymentMethod: method,
          totalRevenueSYP: 0,
          totalRevenueUSD: 0,
          transactionCount: 0,
          percentage: 0,
        };

        existing.totalRevenueSYP += Number(payment.amountSYP) || 0;
        existing.totalRevenueUSD += Number(payment.amountUSD) || 0;
        existing.transactionCount++;

        paymentMethodMap.set(method, existing);
      });
    });

    const paymentMethodRevenue = Array.from(paymentMethodMap.values()).map(pm => ({
      ...pm,
      percentage: totalRevenueSYP > 0 ? (pm.totalRevenueSYP / totalRevenueSYP) * 100 : 0,
    }));

    // Simplified cash flow
    const cashFlow: CashFlowEntry[] = [];
    const dailyFlowMap = new Map<string, CashFlowEntry>();

    invoices.forEach(invoice => {
      const dateKey = invoice.createdAt.toISOString().split('T')[0];
      const existing = dailyFlowMap.get(dateKey) || {
        date: invoice.createdAt,
        inflowSYP: 0,
        outflowSYP: 0,
        netFlowSYP: 0,
        balanceSYP: 0,
      };

      existing.inflowSYP += Number(invoice.totalSYP) || 0;
      dailyFlowMap.set(dateKey, existing);
    });

    let runningBalance = 0;
    const sortedEntries = Array.from(dailyFlowMap.values()).sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    sortedEntries.forEach(entry => {
      entry.netFlowSYP = entry.inflowSYP - entry.outflowSYP;
      runningBalance += entry.netFlowSYP;
      entry.balanceSYP = runningBalance;
    });

    return {
      totalRevenueSYP,
      totalRevenueUSD,
      totalExpensesSYP,
      totalExpensesUSD,
      netProfitSYP,
      netProfitUSD,
      profitMargin,
      revenueByPaymentMethod: paymentMethodRevenue,
      expensesByCategory: [],
      cashFlow: sortedEntries,
    };
  }

  // ============================================
  // CUSTOMER INSIGHTS
  // ============================================

  async getCustomerInsightsReport(tenantId: string, filters: ReportFilters = {}): Promise<CustomerInsightsReport> {
    const { dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Get all customers
    const customers = await prisma.customer.findMany({ where });

    // Get invoices to calculate customer activity
    const invoices = await prisma.invoice.findMany({ where });

    // Calculate customer activity
    const customerActivity = new Map<string, {
      lastVisit: Date;
      totalVisits: number;
      totalRevenue: number;
    }>();

    invoices.forEach(invoice => {
      if (!invoice.customerId) return;
      const existing = customerActivity.get(invoice.customerId) || {
        lastVisit: invoice.createdAt,
        totalVisits: 0,
        totalRevenue: 0,
      };

      if (invoice.createdAt > existing.lastVisit) {
        existing.lastVisit = invoice.createdAt;
      }

      existing.totalVisits++;
      existing.totalRevenue += Number(invoice.totalSYP) || 0;

      customerActivity.set(invoice.customerId, existing);
    });

    // Calculate metrics
    const totalCustomers = customers.length;
    const activeCustomers = customerActivity.size;
    const newCustomers = customers.filter(c => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return c.createdAt >= thirtyDaysAgo;
    }).length;

    const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.totalSYP) || 0), 0);
    const averageCustomerValue = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

    // Customer segments
    const segments: CustomerSegment[] = [
      {
        segment: 'NEW',
        count: newCustomers,
        averageValue: 0,
        totalRevenue: 0,
      },
      {
        segment: 'ACTIVE',
        count: activeCustomers - newCustomers,
        averageValue: averageCustomerValue,
        totalRevenue: totalRevenue,
      },
      {
        segment: 'INACTIVE',
        count: totalCustomers - activeCustomers,
        averageValue: 0,
        totalRevenue: 0,
      },
    ];

    // Churn risk customers (inactive for 90+ days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const churnRiskCustomers: ChurnRiskCustomer[] = [];
    customerActivity.forEach((activity, customerId) => {
      const daysSinceLastVisit = Math.floor((Date.now() - activity.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastVisit >= 90) {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
          let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          if (daysSinceLastVisit >= 180) riskLevel = 'HIGH';
          else if (daysSinceLastVisit >= 120) riskLevel = 'MEDIUM';

          churnRiskCustomers.push({
            customerId: customer.id,
            customerName: customer.fullName,
            lastVisitDate: activity.lastVisit,
            daysSinceLastVisit,
            totalVisits: activity.totalVisits,
            totalRevenue: activity.totalRevenue,
            riskLevel,
          });
        }
      }
    });

    // Customer lifetime value (simplified)
    const customerLifetimeValue = averageCustomerValue * 2; // Assuming 2-year average relationship

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      averageCustomerValue,
      customerSegments: segments,
      churnRiskCustomers: churnRiskCustomers.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
      customerLifetimeValue,
    };
  }
}
