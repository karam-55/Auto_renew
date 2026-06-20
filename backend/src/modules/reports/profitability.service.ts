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
    // Get invoice with items and booking (which has services)
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
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
            schedules: true,
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate parts cost from invoice items (using part cost)
    let partsCost = 0;
    for (const item of invoice.items) {
      if (item.part) {
        partsCost += Number(item.part.costSYP) * item.quantity;
      }
    }

    // Calculate labor cost from booking services
    let laborCost = 0;
    if (invoice.booking?.bookingServices && invoice.booking.mechanicAssignments?.length > 0) {
      const assignment = invoice.booking.mechanicAssignments[0];
      const hourlyRate = await this.getTechnicianHourlyRate(assignment.mechanicUserId, tenantId);
      
      for (const bookingService of invoice.booking.bookingServices) {
        // Try to get actual duration from schedule
        let durationHours = 0;
        
        if (invoice.booking.schedules && invoice.booking.schedules.length > 0) {
          // Find schedule for this service
          const schedule = invoice.booking.schedules.find(s => s.serviceId === bookingService.serviceId);
          if (schedule) {
            const actualDurationMinutes = await this.scheduleService.getActualDuration(schedule.id, tenantId);
            durationHours = actualDurationMinutes > 0 ? actualDurationMinutes / 60 : 0;
          }
        }
        
        // Fallback to service duration if no actual time available
        if (durationHours === 0) {
          durationHours = bookingService.service.duration ? bookingService.service.duration / 60 : 0;
        }
        
        laborCost += durationHours * hourlyRate;
      }
    }

    // Get overhead percentage from company settings
    const companySettings = await prisma.companySettings.findUnique({
      where: { tenantId },
    });

    const overheadPercentage = companySettings?.overheadPercentage ? Number(companySettings.overheadPercentage) : 0.10;
    const overhead = (partsCost + laborCost) * overheadPercentage;

    const revenue = Number(invoice.totalSYP);
    const totalCost = partsCost + laborCost + overhead;
    const profit = revenue - totalCost;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      revenue,
      partsCost,
      laborCost,
      overhead,
      totalCost,
      profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
    };
  }

  async calculateServiceProfit(tenantId: string, from?: Date, to?: Date) {
    const where: any = { tenantId };
    if (from) where.createdAt = { ...where.createdAt, gte: from };
    if (to) where.createdAt = { ...where.createdAt, lte: to };

    // Get all bookings with services
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

    // Group by service
    const serviceProfitMap = new Map<string, any>();

    for (const booking of bookings) {
      for (const bookingService of booking.bookingServices) {
        const serviceId = bookingService.serviceId;
        const serviceName = bookingService.service.name;

        if (!serviceProfitMap.has(serviceId)) {
          serviceProfitMap.set(serviceId, {
            serviceId,
            serviceName,
            count: 0,
            totalRevenue: 0,
            totalPartsCost: 0,
            totalLaborCost: 0,
            totalOverhead: 0,
            totalProfit: 0,
          });
        }

        const serviceData = serviceProfitMap.get(serviceId);
        serviceData.count++;

        // Revenue portion
        const serviceRevenue = Number(bookingService.priceSYP);
        serviceData.totalRevenue += serviceRevenue;

        // Labor cost
        const durationHours = bookingService.service.duration ? bookingService.service.duration / 60 : 0;
        const hourlyRate = booking.mechanicAssignments?.length 
          ? await this.getTechnicianHourlyRate(booking.mechanicAssignments[0].mechanicUserId, tenantId)
          : 0;
        const laborCost = durationHours * hourlyRate;
        serviceData.totalLaborCost += laborCost;

        // Parts cost (simplified - allocate proportionally)
        const partsCost = serviceRevenue * 0.3; // Simplified assumption
        serviceData.totalPartsCost += partsCost;

        // Overhead
        const companySettings = await prisma.companySettings.findUnique({
          where: { tenantId },
        });
        const overheadPercentage = companySettings?.overheadPercentage ? Number(companySettings.overheadPercentage) : 0.10;
        const overhead = (partsCost + laborCost) * overheadPercentage;
        serviceData.totalOverhead += overhead;

        // Profit
        const profit = serviceRevenue - (partsCost + laborCost + overhead);
        serviceData.totalProfit += profit;
      }
    }

    // Convert to array and calculate averages
    const result = Array.from(serviceProfitMap.values()).map((data) => ({
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      count: data.count,
      avgRevenue: data.totalRevenue / data.count,
      avgPartsCost: data.totalPartsCost / data.count,
      avgLaborCost: data.totalLaborCost / data.count,
      avgOverhead: data.totalOverhead / data.count,
      avgProfit: data.totalProfit / data.count,
      avgProfitMargin: data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0,
    }));

    return result;
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
          partsCost += Number(item.part.costSYP) * item.quantity;
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
