import { WorkOrderStatus } from '@prisma/client';
import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import { isValidQuantity } from '../../utils/quantity';
import { InvoiceService } from '../invoices/service';

export interface WorkOrderFilters {
  status?: WorkOrderStatus;
  search?: string;
  page?: number;
  limit?: number;
}

const workOrderInclude = {
  booking: {
    include: {
      customer: { select: { id: true, fullName: true, phone: true } },
      vehicle: { select: { id: true, make: true, model: true, year: true, licensePlate: true } },
      bookingServices: {
        where: { deletedAt: null },
        include: {
          service: true,
          materials: { include: { part: true } },
          expenses: {
            where: { deletedAt: null, category: 'JOB_PURCHASE' },
            include: { supplier: { select: { id: true, name: true } } },
            orderBy: { expenseDate: 'asc' as const },
          },
        },
        orderBy: { createdAt: 'asc' as const },
      },
      invoices: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  },
};

export class WorkOrderService {
  private invoiceService = new InvoiceService();

  async getAllWorkOrders(tenantId: string, filters: WorkOrderFilters = {}) {
    const { status, search, page = 1, limit = 50 } = filters;
    const where: any = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.booking = {
        OR: [
          { customer: { fullName: { contains: search, mode: 'insensitive' } } },
          { vehicle: { model: { contains: search, mode: 'insensitive' } } },
          { vehicle: { licensePlate: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: workOrderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWorkOrderById(tenantId: string, id: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: workOrderInclude,
    });
    if (!workOrder) throw new Error('Work order not found');
    const jobCosts = await prisma.bookingJobCost.findMany({
      where: { tenantId, bookingId: workOrder.bookingId },
    });
    return { ...workOrder, jobCosts };
  }

  async getWorkOrderByBooking(tenantId: string, bookingId: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { tenantId, bookingId },
      include: workOrderInclude,
    });
    if (!workOrder) throw new Error('Work order not found');
    const jobCosts = await prisma.bookingJobCost.findMany({ where: { tenantId, bookingId } });
    return { ...workOrder, jobCosts };
  }

  async ensureForBooking(tenantId: string, bookingId: string, createdById?: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!booking) throw new Error('Booking not found');

    return prisma.workOrder.upsert({
      where: { bookingId },
      create: { tenantId, bookingId, createdById: createdById || null },
      update: {},
      include: workOrderInclude,
    });
  }

  async createWorkOrder(tenantId: string, data: { bookingId: string; createdById?: string }) {
    if (!data.bookingId) throw new Error('A booking is required for a work order');
    return this.ensureForBooking(tenantId, data.bookingId, data.createdById);
  }

  async setServicePrice(
    tenantId: string,
    workOrderId: string,
    bookingServiceId: string,
    input: { priceSYP?: number; priceUSD?: number; quantity?: number }
  ) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      select: { id: true, bookingId: true, status: true },
    });
    if (!workOrder) throw new Error('Work order not found');
    if (['COMPLETED', 'CANCELLED'].includes(workOrder.status)) {
      throw new Error('A closed work order cannot be repriced');
    }

    const line = await prisma.bookingService.findFirst({
      where: { id: bookingServiceId, bookingId: workOrder.bookingId, deletedAt: null },
      select: { id: true, quantity: true },
    });
    if (!line) throw new Error('Service is not part of this work order');

    const quantity = input.quantity == null ? Number(line.quantity) : Number(input.quantity);
    if (!isValidQuantity(quantity)) throw new Error('Service quantity must be positive and use at most three decimals');
    let priceSYP = Number(input.priceSYP ?? 0);
    let priceUSD = input.priceUSD == null ? null : Number(input.priceUSD);
    if (!Number.isFinite(priceSYP) || priceSYP < 0 || (priceUSD != null && (!Number.isFinite(priceUSD) || priceUSD < 0))) {
      throw new Error('Service price cannot be negative');
    }

    const rate = await settingsService.getRequiredExchangeRate(tenantId);
    if (priceUSD != null && priceSYP === 0 && priceUSD > 0) {
      priceSYP = Math.round(priceUSD * rate * 100) / 100;
    } else if (priceSYP > 0 && (priceUSD == null || priceUSD === 0)) {
      priceUSD = Math.round((priceSYP / rate) * 100) / 100;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.bookingService.update({
        where: { id: bookingServiceId },
        data: { priceSYP, priceUSD, quantity, priceFinalized: true },
      });
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: workOrder.status === 'OPEN' ? 'IN_PROGRESS' : workOrder.status,
          startedAt: workOrder.status === 'OPEN' ? new Date() : undefined,
        },
      });
      return tx.bookingService.findUnique({
        where: { id: bookingServiceId },
        include: { service: true },
      });
    });
    return updated;
  }

  async addInventoryMaterial(
    tenantId: string,
    workOrderId: string,
    input: { bookingServiceId: string; partId: string; quantity: number; quantityUnit?: 'BASE' | 'PACKAGE' }
  ) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      select: { id: true, bookingId: true, status: true },
    });
    if (!workOrder) throw new Error('Work order not found');
    if (['COMPLETED', 'CANCELLED'].includes(workOrder.status)) {
      throw new Error('Materials cannot be added to a closed work order');
    }

    const bookingService = await prisma.bookingService.findFirst({
      where: { id: input.bookingServiceId, bookingId: workOrder.bookingId, deletedAt: null },
      select: { id: true, service: { select: { serviceType: true } } },
    });
    if (!bookingService) throw new Error('Service is not part of this work order');

    const part = await prisma.part.findFirst({
      where: { id: input.partId, tenantId, isActive: true, deletedAt: null },
      select: { id: true, quantity: true, unitsPerPackage: true, purchaseUnitName: true, baseUnitName: true },
    });
    if (!part) throw new Error('Inventory item not found or inactive');

    const enteredQuantity = Number(input.quantity);
    if (!isValidQuantity(enteredQuantity)) throw new Error('Enter a positive quantity with at most three decimals');
    const baseQuantity = input.quantityUnit === 'PACKAGE'
      ? enteredQuantity * Number(part.unitsPerPackage || 0)
      : enteredQuantity;
    if (!isValidQuantity(baseQuantity)) throw new Error('Package conversion is not configured for this item');

    const planned = await prisma.bookingServiceMaterial.findMany({
      where: {
        partId: part.id,
        bookingService: { bookingId: workOrder.bookingId },
      },
      select: { quantity: true, issuedQuantity: true },
    });
    const alreadyPlanned = planned.reduce(
      (sum, material) => sum + Math.max(0, Number(material.quantity) - Number(material.issuedQuantity || 0)),
      0,
    );
    if (baseQuantity + alreadyPlanned > Number(part.quantity)) {
      throw new Error(`Available stock is ${Number(part.quantity).toFixed(3)} ${part.baseUnitName || ''}`.trim());
    }

    const material = await prisma.$transaction(async (tx) => {
      const createdMaterial = await tx.bookingServiceMaterial.create({
        data: {
          bookingServiceId: bookingService.id,
          partId: part.id,
          quantity: baseQuantity,
        },
        include: { part: true },
      });
      if (['OIL_PAID', 'OIL_WARRANTY'].includes(bookingService.service.serviceType)) {
        await tx.bookingService.update({
          where: { id: bookingService.id },
          data: { priceSYP: 0, priceUSD: 0, priceFinalized: true },
        });
      }
      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: {
          status: workOrder.status === 'OPEN' ? 'IN_PROGRESS' : workOrder.status,
          startedAt: workOrder.status === 'OPEN' ? new Date() : undefined,
        },
      });
      return createdMaterial;
    });
    return material;
  }

  async updateWorkOrder(tenantId: string, id: string, data: { status?: string; notes?: string }) {
    const existing = await prisma.workOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Work order not found');
    if (data.status === 'COMPLETED') {
      throw new Error('Use the finish-work-order action to create the invoice and close the order');
    }
    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status as WorkOrderStatus }),
        ...(data.status === 'IN_PROGRESS' && !existing.startedAt && { startedAt: new Date() }),
      },
      include: workOrderInclude,
    });
    return updated;
  }

  async completeWorkOrder(tenantId: string, id: string, userId: string) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: { booking: { select: { id: true } } },
    });
    if (!workOrder) throw new Error('Work order not found');
    if (workOrder.status === 'CANCELLED') throw new Error('A cancelled work order cannot be completed');

    const serviceLines = await prisma.bookingService.findMany({
      where: { bookingId: workOrder.bookingId, deletedAt: null },
      include: { service: { select: { serviceType: true, priceSYP: true, priceUSD: true } } },
    });
    for (const line of serviceLines) {
      if (line.priceFinalized || line.service.serviceType !== 'FIXED') continue;
      const priceSYP = Number(line.service.priceSYP || 0);
      const priceUSD = line.service.priceUSD == null ? 0 : Number(line.service.priceUSD);
      if (priceSYP <= 0 && priceUSD <= 0) {
        throw new Error('Set a sale price on the service catalog before completing this fixed-price operation');
      }
      const rate = await settingsService.getRequiredExchangeRate(tenantId);
      await prisma.bookingService.update({
        where: { id: line.id },
        data: {
          priceSYP: priceSYP > 0 ? priceSYP : Math.round(priceUSD * rate * 100) / 100,
          priceUSD: priceUSD > 0 ? priceUSD : Math.round((priceSYP / rate) * 100) / 100,
          priceFinalized: true,
        },
      });
    }

    const plannedMaterials = await prisma.bookingServiceMaterial.findMany({
      where: { bookingService: { bookingId: workOrder.bookingId } },
      select: { id: true, quantity: true, issuedQuantity: true },
    });
    await prisma.$transaction(async (tx) => {
      for (const material of plannedMaterials) {
        const issuedQuantity = Number(material.issuedQuantity || 0);
        if (issuedQuantity <= 0) {
          await tx.bookingServiceMaterial.delete({ where: { id: material.id } });
        } else if (issuedQuantity < Number(material.quantity)) {
          await tx.bookingServiceMaterial.update({
            where: { id: material.id },
            data: { quantity: issuedQuantity },
          });
        }
      }
    });

    const invoice = await this.invoiceService.createAndFinalizeWorkOrderInvoice(
      tenantId,
      workOrder.bookingId,
      userId,
    );

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { status: 'COMPLETED', completedAt: workOrder.completedAt || new Date() },
      });
      await tx.booking.update({
        where: { id: workOrder.bookingId },
        data: {
          status: 'COMPLETED',
          actualCompletionDate: new Date(),
        },
      });
      return updatedOrder;
    });
    return { workOrder: updated, invoice };
  }

  async deleteWorkOrder(tenantId: string, id: string) {
    const existing = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true },
    });
    if (!existing) throw new Error('Work order not found');
    if (existing.status === 'COMPLETED') throw new Error('Completed work orders cannot be deleted');
    return prisma.workOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getWorkOrderStats(tenantId: string) {
    const [total, open, inProgress, ready, completed] = await Promise.all([
      prisma.workOrder.count({ where: { tenantId } }),
      prisma.workOrder.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.workOrder.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({ where: { tenantId, status: 'READY' } }),
      prisma.workOrder.count({ where: { tenantId, status: 'COMPLETED' } }),
    ]);
    return { total, open, inProgress, ready, completed };
  }
}

export default new WorkOrderService();
