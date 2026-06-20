import { Request, Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { CacheService } from '../../api/services/cache.service';
import { Logger } from '../../infrastructure/logging/logger';

export class DashboardController {
  constructor() {
    // Ensure cache service is connected
    CacheService.connect().catch(() => {
      Logger.warn('Dashboard controller: CacheService not available, falling back to direct DB queries');
    });
  }

  getKPIs = async (req: AuthRequest, res: Response) => {
    const tenantId = req.user!.tenantId;
    const cacheKey = CacheService.generateKey('dashboard', tenantId, 'kpis');
    const cacheTtl = 60; // 1 minute - dashboard data changes frequently

    try {
      // Try cache first
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        Logger.debug(`Dashboard cache HIT for tenant: ${tenantId}`);
        return res.json(cached);
      }
      Logger.debug(`Dashboard cache MISS for tenant: ${tenantId}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      // === STEP 1: Parallel independent count queries ===
      const todayFilter: Prisma.PaymentWhereInput = {
        tenantId,
        paymentDate: { gte: today, lt: tomorrow },
      };

      const [
        bookingsToday,
        carsInWorkshop,
        openInvoicesCount,
        todayRevenueAgg,
        todayRevenueUSDAgg,
        newCustomers,
        pendingPayments,
        overdueInvoices,
        totalBookings,
        totalCustomers,
        totalVehicles,
        completedBookings,
        cancelledBookings,
        bookingsByStatus,
        recentBookings,
        recentInvoices,
        recentPayments,
        totalMechanics,
        activeMechanics,
      ] = await Promise.all([
        // Bookings today
        prisma.booking.count({
          where: { tenantId, scheduledDate: { gte: today, lt: tomorrow } },
        }),
        // Cars in workshop
        prisma.booking.count({
          where: { tenantId, status: 'IN_PROGRESS' },
        }),
        // Open invoices (not PAID)
        prisma.invoice.count({
          where: {
            tenantId,
            status: { in: ['DRAFT', 'ISSUED', 'OVERDUE'] },
          },
        }),
        // Today's revenue SYP - use aggregate instead of findMany + reduce
        prisma.payment.aggregate({
          where: todayFilter,
          _sum: { amountSYP: true },
        }),
        // Today's revenue USD - use aggregate instead of findMany + reduce
        prisma.payment.aggregate({
          where: todayFilter,
          _sum: { amountUSD: true },
        }),
        // New customers today
        prisma.customer.count({
          where: { tenantId, createdAt: { gte: today, lt: tomorrow } },
        }),
        // Pending payments
        prisma.invoice.count({
          where: { tenantId, status: 'ISSUED' },
        }),
        // Overdue invoices
        prisma.invoice.count({
          where: { tenantId, status: 'OVERDUE' },
        }),
        // Total bookings
        prisma.booking.count({ where: { tenantId } }),
        // Total customers
        prisma.customer.count({ where: { tenantId } }),
        // Total vehicles
        prisma.vehicle.count({ where: { tenantId } }),
        // Completed bookings
        prisma.booking.count({ where: { tenantId, status: 'COMPLETED' } }),
        // Cancelled bookings
        prisma.booking.count({ where: { tenantId, status: 'CANCELLED' } }),
        // Booking status breakdown
        prisma.booking.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { id: true },
        }),
        // Recent bookings
        prisma.booking.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            customer: { select: { fullName: true } },
            vehicle: { select: { make: true, model: true } },
          },
        }),
        // Recent invoices
        prisma.invoice.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            customer: { select: { fullName: true } },
          },
        }),
        // Recent payments
        prisma.payment.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            invoice: {
              include: {
                customer: { select: { fullName: true } },
              },
            },
          },
        }),
        // Total mechanics (users with MECHANIC role)
        prisma.user.count({
          where: { tenantId, role: 'MECHANIC', deletedAt: null },
        }),
        // Active mechanics (distinct mechanics assigned to IN_PROGRESS bookings)
        prisma.mechanicAssignment.groupBy({
          by: ['mechanicUserId'],
          where: {
            booking: { tenantId, status: 'IN_PROGRESS' },
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
          _count: { mechanicUserId: true },
        }).then(results => results.length),
      ]);

      // Extract revenue from aggregate results
      const todayRevenue = Number(todayRevenueAgg._sum.amountSYP ?? 0);
      const todayRevenueUSD = Number(todayRevenueUSDAgg._sum.amountUSD ?? 0);

      // === STEP 2: Revenue by day (7 days) - using raw query for date grouping ===
      const revenueByDay = await this._getRevenueByDay(tenantId, sevenDaysAgo, tomorrow);

      // === STEP 3: Bookings by day (7 days) - using raw query for date grouping ===
      const bookingsByDay = await this._getBookingsByDay(tenantId, sevenDaysAgo, tomorrow);

      // === STEP 4: Build recent activities ===
      const recentActivities = [
        ...recentBookings.map(b => ({
          type: 'booking',
          description: `حجز جديد - ${b.customer?.fullName ?? 'عميل'} - ${b.vehicle?.make ?? ''} ${b.vehicle?.model ?? ''}`,
          userName: b.customer?.fullName ?? 'النظام',
          createdAt: b.createdAt,
          entityId: b.id,
        })),
        ...recentInvoices.map(i => ({
          type: 'invoice',
          description: `فاتورة ${i.invoiceNumber ?? ''} - ${i.customer?.fullName ?? 'عميل'} - ${i.totalSYP ? Number(i.totalSYP).toLocaleString() + ' ل.س' : ''}`,
          userName: i.customer?.fullName ?? 'النظام',
          createdAt: i.createdAt,
          entityId: i.id,
        })),
        ...recentPayments.map(p => ({
          type: 'payment',
          description: `دفعة ${p.amountSYP ? Number(p.amountSYP).toLocaleString() + ' ل.س' : ''} - ${p.invoice?.customer?.fullName ?? 'عميل'}`,
          userName: p.invoice?.customer?.fullName ?? 'النظام',
          createdAt: p.createdAt,
          entityId: p.id,
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);

      const result = {
        bookingsToday,
        carsInWorkshop,
        activeMechanics,
        totalMechanics,
        openInvoicesCount,
        todayRevenue,
        todayRevenueUSD,
        newCustomers,
        pendingPayments,
        overdueInvoices,
        totalBookings,
        totalCustomers,
        totalVehicles,
        completedBookings,
        cancelledBookings,
        bookingsByStatus: bookingsByStatus.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        revenueByDay,
        bookingsByDay,
        recentActivities: recentActivities.map(a => ({
          description: a.description,
          entity: a.type,
          timeAgo: this._getRelativeTime(a.createdAt),
          userName: a.userName,
          entityId: a.entityId,
        })),
      };

      // Store in cache
      await CacheService.set(cacheKey, result, cacheTtl);

      res.json(result);
    } catch (error) {
      Logger.error('Get dashboard KPIs error', error);
      res.status(500).json({ error: 'Failed to fetch dashboard KPIs' });
    }
  };

  /**
   * Get revenue grouped by day using Prisma raw query
   * More efficient than findMany + filter in JS
   */
  private async _getRevenueByDay(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; amount: number }[]> {
    try {
      // Use raw query for date-based grouping in PostgreSQL
      const results = await prisma.$queryRaw<{ paymentdate: Date; totalsyp: Prisma.Decimal }[]>`
        SELECT
          DATE("paymentDate") as "paymentdate",
          SUM("amountSYP") as "totalsyp"
        FROM "Payment"
        WHERE "tenantId" = ${tenantId}
          AND "paymentDate" >= ${startDate}
          AND "paymentDate" < ${endDate}
        GROUP BY DATE("paymentDate")
        ORDER BY DATE("paymentDate")
      `;

      // Build a map for quick lookup
      const dateMap = new Map<string, number>();
      for (const row of results) {
        const d = new Date(row.paymentdate);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateMap.set(dayStr, Number(row.totalsyp ?? 0));
      }

      // Build complete 7-day array (fill missing days with 0)
      const output: { date: string; amount: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        output.push({ date: dayStr, amount: dateMap.get(dayStr) ?? 0 });
      }

      return output;
    } catch (error) {
      Logger.error('Revenue by day query failed', error);
      // Fallback: return empty 7-day structure
      const output: { date: string; amount: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        output.push({ date: dayStr, amount: 0 });
      }
      return output;
    }
  }

  /**
   * Get bookings grouped by day using Prisma raw query
   */
  private async _getBookingsByDay(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; count: number }[]> {
    try {
      const results = await prisma.$queryRaw<{ createdat: Date; count: number }[]>`
        SELECT
          DATE("createdAt") as "createdat",
          COUNT(*)::int as "count"
        FROM "Booking"
        WHERE "tenantId" = ${tenantId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" < ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `;

      // Build a map for quick lookup
      const dateMap = new Map<string, number>();
      for (const row of results) {
        const d = new Date(row.createdat);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateMap.set(dayStr, Number(row.count ?? 0));
      }

      // Build complete 7-day array
      const output: { date: string; count: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        output.push({ date: dayStr, count: dateMap.get(dayStr) ?? 0 });
      }

      return output;
    } catch (error) {
      Logger.error('Bookings by day query failed', error);
      const output: { date: string; count: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        output.push({ date: dayStr, count: 0 });
      }
      return output;
    }
  }

  /**
   * Get Arabic relative time string (e.g. "منذ 5 دقائق", "منذ ساعة", "اليوم")
   */
  private _getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'الأمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SA');
  }
}
