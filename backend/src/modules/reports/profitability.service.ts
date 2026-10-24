import prisma from '../../config/database';
import { ScheduleService } from '../schedule/schedule.service';

export class ProfitabilityService {
  private scheduleService: ScheduleService;

  constructor() {
    this.scheduleService = new ScheduleService();
  }

  async getTechnicianHourlyRate(mechanicUserId: string, tenantId: string): Promise<number> {
    const employee = await prisma.employee.findFirst({
      where: { userId: mechanicUserId, tenantId },
    });
    return employee?.hourlyRate ? Number(employee.hourlyRate) : 0;
  }

  async calculateInvoiceProfit(invoiceId: string, tenantId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { id: true, invoiceNumber: true, bookingId: true, totalSYP: true },
    });
    if (!invoice) throw new Error('Invoice not found');

    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: { tenantId, invoiceId: invoice.id, deletedAt: null },
      select: { id: true },
    });
    const sourceIds = inventoryTransactions.map((transaction) => transaction.id);
    const sourceFilters: any[] = [{ sourceType: 'INVOICE', sourceId: invoice.id }];
    if (invoice.bookingId) sourceFilters.push({ bookingId: invoice.bookingId });
    if (sourceIds.length) sourceFilters.push({ sourceType: 'INVENTORY_TRANSACTION', sourceId: { in: sourceIds } });
    const lines = await prisma.journalLine.findMany({
      where: { entry: { tenantId, status: 'POSTED' }, OR: sourceFilters },
      include: { account: { select: { accountType: true } } },
    });

    let revenueSYP = 0;
    let directCostSYP = 0;
    for (const line of lines) {
      if (line.account.accountType === 'REVENUE' && line.sourceType === 'INVOICE' && line.sourceId === invoice.id) {
        revenueSYP += Number(line.creditSYP) - Number(line.debitSYP);
      }
      if (line.account.accountType === 'COGS') {
        directCostSYP += Number(line.debitSYP) - Number(line.creditSYP);
      }
    }

    const jobCosts = invoice.bookingId
      ? await prisma.bookingJobCost.findMany({
          where: { bookingId: invoice.bookingId },
          select: { laborCost: true, laborCostUSD: true },
        })
      : [];
    const analyticalLaborCostSYP = jobCosts.reduce((sum, item) => sum + Number(item.laborCost || 0), 0);
    const analyticalLaborCostUSD = jobCosts.reduce((sum, item) => sum + Number(item.laborCostUSD || 0), 0);
    const grossProfitSYP = revenueSYP - directCostSYP;
    const analyticalProfitAfterLaborSYP = grossProfitSYP - analyticalLaborCostSYP;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      revenueSYP,
      postedDirectCostSYP: directCostSYP,
      grossProfitSYP,
      grossMarginPercent: revenueSYP > 0 ? (grossProfitSYP / revenueSYP) * 100 : 0,
      analyticalLaborCostSYP,
      analyticalLaborCostUSD,
      analyticalProfitAfterLaborSYP,
      note: 'الربح الإجمالي مبني على القيود المرحلة؛ أجور الفنيين المدخلة في تحليل أمر الشغل تعرض منفصلة حتى يحدد المحاسب طريقة ترحيلها.',
    };
  }

  private async calculatePostedProfitByDimension(
    tenantId: string,
    dimension: 'serviceId' | 'bookingId' | 'costCenterId',
    from?: Date,
    to?: Date
  ) {
    const entryDate: Record<string, Date> = {};
    if (from) entryDate.gte = from;
    if (to) entryDate.lte = to;
    const lines = await prisma.journalLine.findMany({
      where: {
        [dimension]: { not: '' },
        entry: {
          tenantId,
          status: 'POSTED',
          ...(Object.keys(entryDate).length ? { entryDate } : {}),
        },
      },
      include: {
        account: { select: { accountType: true } },
        service: { select: { id: true, name: true, nameAr: true } },
        booking: { select: { id: true, scheduledDate: true } },
        costCenter: { select: { id: true, code: true, name: true, nameAr: true } },
      },
    });

    const buckets = new Map<string, any>();
    for (const line of lines) {
      const target = (dimension === 'serviceId'
        ? line.service
        : dimension === 'bookingId'
          ? line.booking
          : line.costCenter) as any;
      if (!target) continue;
      const id = target.id;
      const label = dimension === 'serviceId'
        ? target.nameAr || target.name
        : dimension === 'costCenterId'
          ? `${target.code ? `${target.code} — ` : ''}${target.nameAr || target.name}`
          : `أمر شغل #${target.id.slice(0, 8)}`;
      const bucket = buckets.get(id) || {
        id,
        label,
        revenueSYP: 0,
        revenueUSD: 0,
        directCostSYP: 0,
        directCostUSD: 0,
        entryIds: new Set<string>(),
      };
      bucket.entryIds.add(line.entryId);
      const debitSYP = Number(line.debitSYP);
      const creditSYP = Number(line.creditSYP);
      const debitUSD = Number(line.debitUSD);
      const creditUSD = Number(line.creditUSD);
      if (line.account.accountType === 'REVENUE') {
        bucket.revenueSYP += creditSYP - debitSYP;
        bucket.revenueUSD += creditUSD - debitUSD;
      } else if (line.account.accountType === 'COGS') {
        bucket.directCostSYP += debitSYP - creditSYP;
        bucket.directCostUSD += debitUSD - creditUSD;
      }
      buckets.set(id, bucket);
    }

    const laborWhere: any = { tenantId };
    if (dimension === 'serviceId' || dimension === 'bookingId' || dimension === 'costCenterId') {
      laborWhere[dimension] = { not: '' };
    }
    if (from || to) {
      laborWhere.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    const jobCosts = await prisma.bookingJobCost.findMany({
      where: laborWhere,
      select: {
        bookingId: true,
        serviceId: true,
        costCenterId: true,
        laborCost: true,
        laborCostUSD: true,
      },
    });
    const laborByDimension = new Map<string, { syp: number; usd: number }>();
    for (const jobCost of jobCosts) {
      const key = jobCost[dimension];
      if (!key) continue;
      const current = laborByDimension.get(key) || { syp: 0, usd: 0 };
      current.syp += Number(jobCost.laborCost || 0);
      current.usd += Number(jobCost.laborCostUSD || 0);
      laborByDimension.set(key, current);
    }

    return Array.from(buckets.values()).map((bucket) => {
      const grossProfitSYP = bucket.revenueSYP - bucket.directCostSYP;
      const grossProfitUSD = bucket.revenueUSD - bucket.directCostUSD;
      const analyticalLaborCost = laborByDimension.get(bucket.id) || { syp: 0, usd: 0 };
      return {
        id: bucket.id,
        label: bucket.label,
        entries: bucket.entryIds.size,
        revenueSYP: bucket.revenueSYP,
        revenueUSD: bucket.revenueUSD,
        directCostSYP: bucket.directCostSYP,
        directCostUSD: bucket.directCostUSD,
        grossProfitSYP,
        grossProfitUSD,
        grossMarginPercent: bucket.revenueSYP > 0 ? (grossProfitSYP / bucket.revenueSYP) * 100 : 0,
        analyticalLaborCostSYP: analyticalLaborCost.syp,
        analyticalLaborCostUSD: analyticalLaborCost.usd,
        grossProfitAfterAnalyticalLaborSYP: grossProfitSYP - analyticalLaborCost.syp,
        grossProfitAfterAnalyticalLaborUSD: grossProfitUSD - analyticalLaborCost.usd,
      };
    });
  }

  async calculateServiceProfit(tenantId: string, from?: Date, to?: Date) {
    return this.calculatePostedProfitByDimension(tenantId, 'serviceId', from, to);
  }

  async calculateWorkOrderProfit(tenantId: string, from?: Date, to?: Date) {
    return this.calculatePostedProfitByDimension(tenantId, 'bookingId', from, to);
  }

  async calculateDepartmentProfit(tenantId: string, from?: Date, to?: Date) {
    return this.calculatePostedProfitByDimension(tenantId, 'costCenterId', from, to);
  }

  async calculateTechnicianProfit(tenantId: string, from?: Date, to?: Date) {
    const where: any = { tenantId };
    if (from) where.createdAt = { ...where.createdAt, gte: from };
    if (to) where.createdAt = { ...where.createdAt, lte: to };

    // Get all bookings with mechanic assignments
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
        invoices: true,
        mechanicAssignments: {
          include: {
            mechanic: true,
          },
        },
      },
    });

    // Group by technician
    const technicianProfitMap = new Map<string, any>();

    for (const booking of bookings) {
      if (!booking.mechanicAssignments?.length) continue;
      
      const assignment = booking.mechanicAssignments[0];
      const mechanic = assignment.mechanic;
      if (!mechanic) continue;

      const technicianId = mechanic.id;
      const technicianName = mechanic.fullName;

      if (!technicianProfitMap.has(technicianId)) {
        technicianProfitMap.set(technicianId, {
          technicianId,
          technicianName,
          serviceCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        });
      }

      const technicianData = technicianProfitMap.get(technicianId);
      technicianData.serviceCount += booking.bookingServices.length;

      // Revenue from all services in this booking
      const hourlyRate = await this.getTechnicianHourlyRate(assignment.mechanicUserId, tenantId);
      
      for (const bookingService of booking.bookingServices) {
        const revenue = Number(bookingService.priceSYP);
        technicianData.totalRevenue += revenue;

        // Labor cost
        const durationHours = bookingService.service.duration ? bookingService.service.duration / 60 : 0;
        const laborCost = durationHours * hourlyRate;

        // Parts cost (simplified)
        const partsCost = revenue * 0.3;

        // Overhead
        const companySettings = await prisma.companySettings.findUnique({
          where: { tenantId },
        });
        const overheadPercentage = companySettings?.overheadPercentage ? Number(companySettings.overheadPercentage) : 0.10;
        const overhead = (partsCost + laborCost) * overheadPercentage;

        const totalCost = partsCost + laborCost + overhead;
        technicianData.totalCost += totalCost;

        // Profit
        const profit = revenue - totalCost;
        technicianData.totalProfit += profit;
      }
    }

    // Convert to array and add ranking
    const result = Array.from(technicianProfitMap.values())
      .map((data) => ({
        technicianId: data.technicianId,
        technicianName: data.technicianName,
        serviceCount: data.serviceCount,
        revenue: data.totalRevenue,
        cost: data.totalCost,
        profit: data.totalProfit,
        profitMargin: data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .map((data, index) => ({
        ...data,
        rank: index + 1,
      }));

    return result;
  }

  async calculateCustomerProfit(tenantId: string, from?: Date, to?: Date) {
    const where: any = { tenantId };
    if (from) where.createdAt = { ...where.createdAt, gte: from };
    if (to) where.createdAt = { ...where.createdAt, lte: to };

    // Get all invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            part: true,
          },
        },
        booking: {
          include: {
            bookingServices: {
              include: {
                service: true,
              },
            },
            mechanicAssignments: {
              include: {
                mechanic: true,
              },
            },
          },
        },
      },
    });

    // Group by customer
    const customerProfitMap = new Map<string, any>();

    for (const invoice of invoices) {
      const customerId = invoice.customerId;
      if (!customerId) continue;

      const customerName = invoice.customer?.fullName || 'Unknown';

      if (!customerProfitMap.has(customerId)) {
        customerProfitMap.set(customerId, {
          customerId,
          customerName,
          visitCount: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
        });
      }

      const customerData = customerProfitMap.get(customerId);
      customerData.visitCount++;

      // Revenue
      const revenue = Number(invoice.totalSYP);
      customerData.totalRevenue += revenue;

      // Calculate costs
      let partsCost = 0;
      let laborCost = 0;

      // Parts cost from items
      for (const item of invoice.items) {
        if (item.part) {
          partsCost += Number(item.part.costSYP) * Number(item.quantity);
        }
      }

      // Labor cost from booking services
      if (invoice.booking?.bookingServices && invoice.booking.mechanicAssignments?.length > 0) {
        const assignment = invoice.booking.mechanicAssignments[0];
        const hourlyRate = await this.getTechnicianHourlyRate(assignment.mechanicUserId, tenantId);
        
        for (const bookingService of invoice.booking.bookingServices) {
          const durationHours = bookingService.service.duration ? bookingService.service.duration / 60 : 0;
          laborCost += durationHours * hourlyRate;
        }
      }

      // Overhead
      const companySettings = await prisma.companySettings.findUnique({
        where: { tenantId },
      });
      const overheadPercentage = companySettings?.overheadPercentage ? Number(companySettings.overheadPercentage) : 0.10;
      const overhead = (partsCost + laborCost) * overheadPercentage;

      const totalCost = partsCost + laborCost + overhead;
      customerData.totalCost += totalCost;

      // Profit
      const profit = revenue - totalCost;
      customerData.totalProfit += profit;
    }

    // Convert to array
    const result = Array.from(customerProfitMap.values()).map((data) => ({
      customerId: data.customerId,
      customerName: data.customerName,
      visitCount: data.visitCount,
      revenue: data.totalRevenue,
      cost: data.totalCost,
      profit: data.totalProfit,
      profitMargin: data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0,
    }));

    return result;
  }
}
