import prisma from '../../config/database';

/**
 * Dashboard Analytics Service
 * Provides analytics data for the dashboard
 * 
 * Aggregates data from various sources for dashboard visualization
 */

export interface DashboardMetrics {
  totalRevenue: number;
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalCustomers: number;
  activeCustomers: number;
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalPayments: number;
  totalPaymentsSYP: number;
  totalPaymentsUSD: number;
  overdueInvoices: number;
  averageServiceTime: number;
  customerSatisfaction: number | null;
  period: string;
}

export class DashboardAnalyticsService {
  /**
   * Get dashboard metrics for a tenant
   */
  async getDashboardMetrics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardMetrics> {
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    // Get total revenue from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        ...dateFilter
      }
    });

    const totalRevenueSYP = invoices.filter(inv => inv.status !== 'CANCELLED').reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
    const totalRevenueUSD = invoices.filter(inv => inv.status !== 'CANCELLED').reduce((sum, inv) => sum + Number(inv.totalUSD || 0), 0);

    // Get bookings count
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        ...dateFilter
      }
    });

    const activeBookings = bookings.filter(b => b.status === 'IN_PROGRESS' || b.status === 'PENDING').length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

    // Get customers count
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        isActive: true
      }
    });

    // Get invoice status counts
    const pendingInvoices = invoices.filter(i => i.status === 'DRAFT').length;
    const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
    const overdueInvoices = invoices.filter(i => 
      (i.status === 'DRAFT' || i.status === 'SENT') && i.dueDate && new Date(i.dueDate) < new Date()
    ).length;

    // Get payments
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        ...dateFilter
      }
    });

    const totalPaymentsSYP = payments.reduce((sum, p) => sum + Number(p.amountSYP || 0), 0);
    const totalPaymentsUSD = payments.reduce((sum, p) => sum + Number(p.amountUSD || 0), 0);

    // Calculate average service time from completed bookings
    const completedBookingsWithTime = bookings.filter(
      b => b.status === 'COMPLETED' && b.actualCompletionDate && b.createdAt
    );
    let averageServiceTime = 0;
    if (completedBookingsWithTime.length > 0) {
      const totalHours = completedBookingsWithTime.reduce((sum, b) => {
        const start = new Date(b.createdAt).getTime();
        const end = new Date(b.actualCompletionDate!).getTime();
        const diffHours = (end - start) / (1000 * 60 * 60); // convert ms to hours
        return sum + diffHours;
      }, 0);
      averageServiceTime = Math.round((totalHours / completedBookingsWithTime.length) * 10) / 10;
    }

    // Calculate customer satisfaction from actual reviews
    const reviews = await prisma.review.findMany({
      where: { tenantId, ...dateFilter }
    });
    let customerSatisfaction: number | null = null;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      customerSatisfaction = Math.round((totalRating / reviews.length) * 10) / 10;
    }

    return {
      totalRevenue: totalRevenueSYP,
      totalRevenueSYP,
      totalRevenueUSD,
      totalBookings: bookings.length,
      activeBookings,
      completedBookings,
      totalCustomers: customers.length,
      activeCustomers: customers.length,
      totalInvoices: invoices.length,
      pendingInvoices,
      paidInvoices,
      totalPayments: payments.length,
      totalPaymentsSYP,
      totalPaymentsUSD,
      overdueInvoices,
      averageServiceTime,
      customerSatisfaction,
      period: startDate && endDate 
        ? `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        : 'All Time'
    };
  }

  /**
   * Get revenue trend data
   */
  async getRevenueTrend(
    tenantId: string,
    days: number = 30
  ): Promise<Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>> {
    const trend: Array<{ date: string; revenue: number; bookings: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr);
      dayEnd.setHours(23, 59, 59, 999);

      const dayInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const dayBookings = await prisma.booking.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      const revenue = dayInvoices.filter(inv => inv.status !== 'CANCELLED').reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);

      trend.push({
        date: dateStr,
        revenue,
        bookings: dayBookings.length
      });
    }

    return trend;
  }

  /**
   * Get top services by revenue
   */
  async getTopServices(
    tenantId: string,
    limit: number = 5
  ): Promise<Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    revenue: number;
    bookings: number;
  }>> {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: { invoice: { tenantId, status: { not: 'CANCELLED' } } },
      include: { service: true, invoice: true },
    });

    const serviceMap = new Map<string, { id: string; nameEn: string; nameAr: string; revenue: number; bookings: number }>();

    for (const item of invoiceItems) {
      if (item.serviceId && item.service) {
        const existing = serviceMap.get(item.serviceId);
        const itemRevenue = Number(item.totalSYP || 0);
        if (existing) {
          existing.revenue += itemRevenue;
          existing.bookings += 1;
        } else {
          serviceMap.set(item.serviceId, {
            id: item.serviceId,
            nameEn: item.service.nameEn || 'Unknown',
            nameAr: item.service.nameAr || 'Unknown',
            revenue: itemRevenue,
            bookings: 1,
          });
        }
      }
    }

    return Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(
    tenantId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    type: 'BOOKING' | 'INVOICE' | 'PAYMENT' | 'CUSTOMER';
    description: string;
    descriptionAr: string;
    timestamp: Date;
  }>> {
    const [recentBookings, recentInvoices, recentPayments, recentCustomers] = await Promise.all([
      prisma.booking.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { customer: true },
      }),
      prisma.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { customer: true },
      }),
      prisma.payment.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.customer.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const activities: Array<{ id: string; type: 'BOOKING' | 'INVOICE' | 'PAYMENT' | 'CUSTOMER'; description: string; descriptionAr: string; timestamp: Date }> = [];

    for (const b of recentBookings) {
      activities.push({
        id: b.id,
        type: 'BOOKING',
        description: `New booking created for customer ${b.customer?.fullName || 'Unknown'}`,
        descriptionAr: `تم إنشاء حجز جديد للعميل ${b.customer?.fullName || 'Unknown'}`,
        timestamp: b.createdAt,
      });
    }

    for (const i of recentInvoices) {
      activities.push({
        id: i.id,
        type: 'INVOICE',
        description: `Invoice ${i.invoiceNumber} generated`,
        descriptionAr: `تم إنشاء الفاتورة ${i.invoiceNumber}`,
        timestamp: i.createdAt,
      });
    }

    for (const p of recentPayments) {
      activities.push({
        id: p.id,
        type: 'PAYMENT',
        description: `Payment of ${Number(p.amountSYP).toLocaleString()} SYP received`,
        descriptionAr: `تم استلام دفع بقيمة ${Number(p.amountSYP).toLocaleString()} ل.س`,
        timestamp: p.paymentDate || p.createdAt,
      });
    }

    for (const c of recentCustomers) {
      activities.push({
        id: c.id,
        type: 'CUSTOMER',
        description: `New customer registered: ${c.fullName}`,
        descriptionAr: `تم تسجيل عميل جديد: ${c.fullName}`,
        timestamp: c.createdAt,
      });
    }

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    tenantId: string
  ): Promise<{
    bookingCompletionRate: number;
    invoicePaymentRate: number;
    averageRevenuePerBooking: number;
    customerRetentionRate: number;
  }> {
    const bookings = await prisma.booking.findMany({
      where: { tenantId }
    });

    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const bookingCompletionRate = bookings.length > 0 
      ? (completedBookings / bookings.length) * 100 
      : 0;

    const invoices = await prisma.invoice.findMany({
      where: { tenantId }
    });

    const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
    const invoicePaymentRate = invoices.length > 0 
      ? (paidInvoices / invoices.length) * 100 
      : 0;

    const totalRevenue = invoices.filter(inv => inv.status !== 'CANCELLED').reduce((sum, inv) => sum + Number(inv.totalSYP || 0), 0);
    const averageRevenuePerBooking = bookings.length > 0
      ? totalRevenue / bookings.length
      : 0;

    // Calculate actual customer retention rate
    // Retention = customers with more than 1 booking / total customers
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: { _count: { select: { bookings: true } } },
    });
    const returningCustomers = customers.filter(c => c._count.bookings > 1).length;
    const customerRetentionRate = customers.length > 0
      ? Math.round((returningCustomers / customers.length) * 100)
      : 0;

    return {
      bookingCompletionRate,
      invoicePaymentRate,
      averageRevenuePerBooking,
      customerRetentionRate
    };
  }
}

export default new DashboardAnalyticsService();
