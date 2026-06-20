import prisma from '../../config/database';
import { ScheduleStatus } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';
import { WhatsAppService } from '../../api/services/whatsapp.service';

export class ScheduleService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }
  async checkConflict(
    technicianId: string,
    startTime: Date,
    endTime: Date,
    excludeScheduleId?: string
  ): Promise<boolean> {
    const conflicts = await prisma.technicianSchedule.findMany({
      where: {
        technicianId,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        status: { not: ScheduleStatus.CANCELLED },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return conflicts.length > 0;
  }

  async createSchedule(data: {
    tenantId: string;
    technicianId: string;
    bookingId?: string;
    serviceId?: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }) {
    // Check for conflicts
    const hasConflict = await this.checkConflict(
      data.technicianId,
      data.startTime,
      data.endTime
    );

    if (hasConflict) {
      throw new Error('الفني مشغول في هذا الوقت');
    }

    return await prisma.technicianSchedule.create({
      data: {
        tenantId: data.tenantId,
        technicianId: data.technicianId,
        bookingId: data.bookingId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        status: ScheduleStatus.SCHEDULED,
      },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });
  }

  async updateSchedule(
    id: string,
    tenantId: string,
    data: {
      technicianId?: string;
      startTime?: Date;
      endTime?: Date;
      notes?: string;
    }
  ) {
    const existing = await prisma.technicianSchedule.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new Error('Schedule not found');
    }

    // Check for conflicts if technician or time is changing
    if (data.technicianId || data.startTime || data.endTime) {
      const newTechnicianId = data.technicianId || existing.technicianId;
      const newStartTime = data.startTime || existing.startTime;
      const newEndTime = data.endTime || existing.endTime;

      const hasConflict = await this.checkConflict(
        newTechnicianId,
        newStartTime,
        newEndTime,
        id
      );

      if (hasConflict) {
        throw new Error('الفني مشغول في هذا الوقت');
      }
    }

    return await prisma.technicianSchedule.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });
  }

  async startTask(id: string, tenantId: string) {
    const schedule = await prisma.technicianSchedule.findFirst({
      where: { id, tenantId },
      include: {
        technician: true,
        booking: {
          include: {
            customer: true,
          },
        },
        service: true,
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status !== ScheduleStatus.SCHEDULED) {
      throw new Error('Task can only be started from SCHEDULED status');
    }

    const updatedSchedule = await prisma.technicianSchedule.update({
      where: { id },
      data: {
        status: ScheduleStatus.IN_PROGRESS,
        startTime: new Date(), // Update to actual start time
        updatedAt: new Date(),
      },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });

    // Send WhatsApp notification
    if (schedule.booking?.customer) {
      try {
        const technicianName = schedule.technician.fullNameAr || schedule.technician.fullNameEn || 'الفني';
        await this.whatsappService.sendWorkStarted(
          tenantId,
          schedule.booking.customer.phone,
          technicianName
        );
      } catch (error) {
        Logger.error('Failed to send WhatsApp notification:', error);
      }
    }

    return updatedSchedule;
  }

  async completeTask(id: string, tenantId: string) {
    const schedule = await prisma.technicianSchedule.findFirst({
      where: { id, tenantId },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status !== ScheduleStatus.IN_PROGRESS) {
      throw new Error('Task can only be completed from IN_PROGRESS status');
    }

    const updatedSchedule = await prisma.technicianSchedule.update({
      where: { id },
      data: {
        status: ScheduleStatus.COMPLETED,
        endTime: new Date(), // Update to actual end time
        updatedAt: new Date(),
      },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });

    // Send WhatsApp notification
    if (schedule.booking?.customer) {
      try {
        await this.whatsappService.sendWorkCompleted(
          tenantId,
          schedule.booking.customer.phone
        );
      } catch (error) {
        Logger.error('Failed to send WhatsApp notification:', error);
      }
    }

    return updatedSchedule;
  }

  async cancelTask(id: string, tenantId: string) {
    const schedule = await prisma.technicianSchedule.findFirst({
      where: { id, tenantId },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status === ScheduleStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed task');
    }

    return await prisma.technicianSchedule.update({
      where: { id },
      data: {
        status: ScheduleStatus.CANCELLED,
        updatedAt: new Date(),
      },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });
  }

  async getSchedule(tenantId: string, date?: Date, technicianId?: string) {
    const where: any = { tenantId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    if (technicianId) {
      where.technicianId = technicianId;
    }

    return await prisma.technicianSchedule.findMany({
      where,
      include: {
        technician: true,
        booking: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getScheduleById(id: string, tenantId: string) {
    return await prisma.technicianSchedule.findFirst({
      where: { id, tenantId },
      include: {
        technician: true,
        booking: true,
        service: true,
      },
    });
  }

  async createScheduleForBooking(
    bookingId: string,
    tenantId: string,
    technicianId: string,
    scheduledDate: Date
  ) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: {
        bookingServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const schedules = [];
    let currentTime = new Date(scheduledDate);

    for (const bookingService of booking.bookingServices) {
      const durationMinutes = bookingService.service.duration || 60;
      const endTime = new Date(currentTime.getTime() + durationMinutes * 60000);

      try {
        const schedule = await this.createSchedule({
          tenantId,
          technicianId,
          bookingId,
          serviceId: bookingService.serviceId,
          startTime: currentTime,
          endTime,
        });
        schedules.push(schedule);
      } catch (error) {
        // If conflict, skip this service
        Logger.error(`Failed to create schedule for service ${bookingService.serviceId}`, error);
      }

      currentTime = endTime;
    }

    return schedules;
  }

  async cancelScheduleForBooking(bookingId: string, tenantId: string) {
    return await prisma.technicianSchedule.updateMany({
      where: {
        bookingId,
        tenantId,
        status: { not: ScheduleStatus.COMPLETED },
      },
      data: {
        status: ScheduleStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });
  }

  async getActualDuration(scheduleId: string, tenantId: string): Promise<number> {
    const schedule = await prisma.technicianSchedule.findFirst({
      where: { id: scheduleId, tenantId },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // If completed, use actual time
    if (schedule.status === ScheduleStatus.COMPLETED) {
      const diffMs = schedule.endTime.getTime() - schedule.startTime.getTime();
      return diffMs / (1000 * 60); // Return in minutes
    }

    // If in progress, use current time as end time
    if (schedule.status === ScheduleStatus.IN_PROGRESS) {
      const diffMs = new Date().getTime() - schedule.startTime.getTime();
      return diffMs / (1000 * 60);
    }

    // Otherwise, return 0 (not started)
    return 0;
  }
}
