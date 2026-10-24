import prisma from '../../config/database';
import settingsService from '../../services/settings.service';
import {
  CreateBookingJobCostInput,
  UpdateBookingJobCostInput,
  BookingJobCostResponse,
} from './types';

export class BookingJobCostService {
  async getByBooking(tenantId: string, bookingId: string): Promise<BookingJobCostResponse[]> {
    const items = await prisma.bookingJobCost.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(this.mapItem);
  }

  async getById(tenantId: string, id: string): Promise<BookingJobCostResponse | null> {
    const item = await prisma.bookingJobCost.findFirst({
      where: { id, tenantId },
    });
    return item ? this.mapItem(item) : null;
  }

  async create(tenantId: string, input: CreateBookingJobCostInput): Promise<BookingJobCostResponse> {
    const [booking, service] = await Promise.all([
      prisma.booking.findFirst({ where: { id: input.bookingId, tenantId, deletedAt: null }, select: { id: true } }),
      prisma.service.findFirst({
        where: { id: input.serviceId, tenantId, deletedAt: null },
        select: { id: true, category: { select: { costCenterId: true } } },
      }),
    ]);
    if (!booking) throw new Error('Work order not found');
    if (!service) throw new Error('Service not found');
    const costCenterId = input.costCenterId || service.category?.costCenterId || null;
    if (costCenterId) {
      const center = await prisma.costCenter.findFirst({
        where: { id: costCenterId, tenantId, isActive: true },
        select: { id: true },
      });
      if (!center) throw new Error('Cost center not found or inactive');
    }

    const exchangeRateUsed = input.exchangeRateUsed || await settingsService.getRequiredExchangeRate(tenantId);
    const laborCost = input.laborCost ?? (input.laborCostUSD != null ? Math.round(input.laborCostUSD * exchangeRateUsed * 100) / 100 : null);
    const laborCostUSD = input.laborCostUSD ?? (input.laborCost != null ? Math.round((input.laborCost / exchangeRateUsed) * 100) / 100 : null);
    const materialCost = input.materialCost ?? (input.materialCostUSD != null ? Math.round(input.materialCostUSD * exchangeRateUsed * 100) / 100 : null);
    const materialCostUSD = input.materialCostUSD ?? (input.materialCost != null ? Math.round((input.materialCost / exchangeRateUsed) * 100) / 100 : null);
    const overheadCost = input.overheadCost ?? (input.overheadCostUSD != null ? Math.round(input.overheadCostUSD * exchangeRateUsed * 100) / 100 : null);
    const overheadCostUSD = input.overheadCostUSD ?? (input.overheadCost != null ? Math.round((input.overheadCost / exchangeRateUsed) * 100) / 100 : null);
    const totalCost = input.totalCost ?? ((laborCost || 0) + (materialCost || 0) + (overheadCost || 0));
    const totalCostUSD = input.totalCostUSD ?? ((laborCostUSD || 0) + (materialCostUSD || 0) + (overheadCostUSD || 0));

    const existingCost = await prisma.bookingJobCost.findUnique({
      where: { bookingId_serviceId: { bookingId: input.bookingId, serviceId: input.serviceId } },
      select: { id: true },
    });
    if (existingCost) {
      const updated = await this.update(tenantId, existingCost.id, input);
      if (updated) return updated;
    }

    const item = await prisma.bookingJobCost.create({
      data: {
        tenantId,
        bookingId: input.bookingId,
        mechanicId: input.mechanicId || null,
        serviceId: input.serviceId,
        costCenterId,
        laborHours: input.laborHours ?? null,
        laborCost,
        laborCostUSD,
        materialCost,
        materialCostUSD,
        overheadCost,
        overheadCostUSD,
        totalCost,
        totalCostUSD,
        exchangeRateUsed,
        varianceNote: input.varianceNote || null,
      },
    });
    return this.mapItem(item);
  }

  async update(tenantId: string, id: string, input: UpdateBookingJobCostInput): Promise<BookingJobCostResponse | null> {
    const existing = await prisma.bookingJobCost.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    const exchangeRateUsed = input.exchangeRateUsed || Number(existing.exchangeRateUsed || await settingsService.getRequiredExchangeRate(tenantId));
    const newLabor = input.laborCost ?? (input.laborCostUSD != null
      ? Math.round(input.laborCostUSD * exchangeRateUsed * 100) / 100
      : Number(existing.laborCost ?? 0));
    const newLaborUSD = input.laborCostUSD ?? (input.laborCost != null
      ? Math.round((input.laborCost / exchangeRateUsed) * 100) / 100
      : Number(existing.laborCostUSD ?? 0));
    const newMaterial = input.materialCost ?? (input.materialCostUSD != null
      ? Math.round(input.materialCostUSD * exchangeRateUsed * 100) / 100
      : Number(existing.materialCost ?? 0));
    const newMaterialUSD = input.materialCostUSD ?? (input.materialCost != null
      ? Math.round((input.materialCost / exchangeRateUsed) * 100) / 100
      : Number(existing.materialCostUSD ?? 0));
    const newOverhead = input.overheadCost ?? (input.overheadCostUSD != null
      ? Math.round(input.overheadCostUSD * exchangeRateUsed * 100) / 100
      : Number(existing.overheadCost ?? 0));
    const newOverheadUSD = input.overheadCostUSD ?? (input.overheadCost != null
      ? Math.round((input.overheadCost / exchangeRateUsed) * 100) / 100
      : Number(existing.overheadCostUSD ?? 0));
    const totalCost = input.totalCost ?? (newLabor + newMaterial + newOverhead);
    const totalCostUSD = input.totalCostUSD ?? (newLaborUSD + newMaterialUSD + newOverheadUSD);

    await prisma.bookingJobCost.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.mechanicId !== undefined && { mechanicId: input.mechanicId }),
        ...(input.serviceId && { serviceId: input.serviceId }),
        ...(input.costCenterId !== undefined && { costCenterId: input.costCenterId }),
        ...(input.laborHours !== undefined && { laborHours: input.laborHours }),
        ...(input.laborCost !== undefined || input.laborCostUSD !== undefined ? { laborCost: newLabor, laborCostUSD: newLaborUSD } : {}),
        ...(input.materialCost !== undefined || input.materialCostUSD !== undefined ? { materialCost: newMaterial, materialCostUSD: newMaterialUSD } : {}),
        ...(input.overheadCost !== undefined || input.overheadCostUSD !== undefined ? { overheadCost: newOverhead, overheadCostUSD: newOverheadUSD } : {}),
        totalCost,
        totalCostUSD,
        exchangeRateUsed,
        ...(input.varianceNote !== undefined && { varianceNote: input.varianceNote }),
      },
    });
    return this.getById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    try {
      await prisma.bookingJobCost.deleteMany({ where: { id, tenantId } });
      return true;
    } catch {
      return false;
    }
  }

  async calculateJobCostVariance(
    tenantId: string,
    bookingId: string,
    estimatedLaborCost: number,
    estimatedMaterialCost: number,
    estimatedOverheadCost: number
  ): Promise<{ actualTotal: number; estimatedTotal: number; variance: number; variancePercent: number }> {
    const items = await prisma.bookingJobCost.findMany({
      where: { tenantId, bookingId },
    });

    const actualTotal = items.reduce((sum, i) => {
      return sum + Number(i.totalCost || 0);
    }, 0);

    const estimatedTotal = estimatedLaborCost + estimatedMaterialCost + estimatedOverheadCost;
    const variance = actualTotal - estimatedTotal;
    const variancePercent = estimatedTotal > 0 ? (variance / estimatedTotal) * 100 : 0;

    return { actualTotal, estimatedTotal, variance, variancePercent };
  }

  private mapItem(item: any): BookingJobCostResponse {
    return {
      id: item.id,
      tenantId: item.tenantId,
      bookingId: item.bookingId,
      mechanicId: item.mechanicId,
      serviceId: item.serviceId,
      costCenterId: item.costCenterId,
      laborHours: item.laborHours ? Number(item.laborHours) : null,
      laborCost: item.laborCost ? Number(item.laborCost) : null,
      laborCostUSD: item.laborCostUSD ? Number(item.laborCostUSD) : null,
      materialCost: item.materialCost ? Number(item.materialCost) : null,
      materialCostUSD: item.materialCostUSD ? Number(item.materialCostUSD) : null,
      overheadCost: item.overheadCost ? Number(item.overheadCost) : null,
      overheadCostUSD: item.overheadCostUSD ? Number(item.overheadCostUSD) : null,
      totalCost: item.totalCost ? Number(item.totalCost) : null,
      totalCostUSD: item.totalCostUSD ? Number(item.totalCostUSD) : null,
      exchangeRateUsed: item.exchangeRateUsed ? Number(item.exchangeRateUsed) : null,
      varianceNote: item.varianceNote,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export const bookingJobCostService = new BookingJobCostService();
