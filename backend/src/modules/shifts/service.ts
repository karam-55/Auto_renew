import prisma from '../../config/database';
import { CreateShiftInput, UpdateShiftInput, ShiftResponse } from './types';

export class ShiftService {
  async getAllShifts(tenantId: string, page: number = 1, limit: number = 50): Promise<{ shifts: ShiftResponse[], total: number }> {
    const skip = (page - 1) * limit;

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          nameAr: true,
          nameEn: true,
          startTime: true,
          endTime: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shift.count({ where: { tenantId } }),
    ]);

    return { shifts, total };
  }

  async getShiftById(tenantId: string, shiftId: string): Promise<ShiftResponse | null> {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shift;
  }

  async searchShifts(tenantId: string, query: string): Promise<ShiftResponse[]> {
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        OR: [
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return shifts;
  }

  async createShift(tenantId: string, data: CreateShiftInput): Promise<ShiftResponse> {
    // Validate shift times
    if (!data.startTime || !data.endTime) {
      throw new Error('Start time and end time are required');
    }

    // Parse times to compare
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);

    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    const shift = await prisma.shift.create({
      data: {
        tenantId,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shift;
  }

  async updateShift(tenantId: string, shiftId: string, data: UpdateShiftInput): Promise<ShiftResponse> {
    // Check if shift exists and belongs to tenant
    const existingShift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
    });

    if (!existingShift) {
      throw new Error('Shift not found');
    }

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      },
      select: {
        id: true,
        tenantId: true,
        nameAr: true,
        nameEn: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shift;
  }

  async deleteShift(tenantId: string, shiftId: string): Promise<void> {
    // Check if shift exists and belongs to tenant
    const existingShift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
    });

    if (!existingShift) {
      throw new Error('Shift not found');
    }

    // Check if shift is used in any attendance records
    const attendanceCount = await prisma.attendance.count({
      where: { shiftId },
    });

    if (attendanceCount > 0) {
      throw new Error('Cannot delete shift with existing attendance records');
    }

    await prisma.shift.delete({
      where: { id: shiftId },
    });
  }
}
