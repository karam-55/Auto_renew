import prisma from '../../config/database';
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
    const totalCost =
      (input.laborCost || 0) +
      (input.materialCost || 0) +
      (input.overheadCost || 0);

    const item = await prisma.bookingJobCost.create({
      data: {
        tenantId,
        bookingId: input.bookingId,
        mechanicId: input.mechanicId || null,
        serviceId: input.serviceId,
        costCenterId: input.costCenterId || null,
        laborHours: input.laborHours ?? null,
        laborCost: input.laborCost ?? null,
        materialCost: input.materialCost ?? null,
        overheadCost: input.overheadCost ?? null,
        totalCost: input.totalCost ?? totalCost,
        varianceNote: input.varianceNote || null,
      },
    });
    return this.mapItem(item);
  }

  async update(tenantId: string, id: string, input: UpdateBookingJobCostInput): Promise<BookingJobCostResponse | null> {
    const existing = await prisma.bookingJobCost.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    const newLabor = input.laborCost ?? Number(existing.laborCost ?? 0);
    const newMaterial = input.materialCost ?? Number(existing.materialCost ?? 0);
    const newOverhead = input.overheadCost ?? Number(existing.overheadCost ?? 0);
    const totalCost = input.totalCost ?? (newLabor + newMaterial + newOverhead);

    await prisma.bookingJobCost.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.mechanicId !== undefined && { mechanicId: input.mechanicId }),
        ...(input.serviceId && { serviceId: input.serviceId }),
        ...(input.costCenterId !== undefined && { costCenterId: input.costCenterId }),
        ...(input.laborHours !== undefined && { laborHours: input.laborHours }),
        ...(input.laborCost !== undefined && { laborCost: input.laborCost }),
        ...(input.materialCost !== undefined && { materialCost: input.materialCost }),
        ...(input.overheadCost !== undefined && { overheadCost: input.overheadCost }),
        totalCost,
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
      materialCost: item.materialCost ? Number(item.materialCost) : null,
      overheadCost: item.overheadCost ? Number(item.overheadCost) : null,
      totalCost: item.totalCost ? Number(item.totalCost) : null,
      varianceNote: item.varianceNote,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export const bookingJobCostService = new BookingJobCostService();
