import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import {
  PreventiveMaintenanceTemplate,
  CreatePreventiveMaintenanceTemplateInput,
  UpdatePreventiveMaintenanceTemplateInput,
  PreventiveMaintenanceLog,
  CreatePreventiveMaintenanceLogInput,
  UpdatePreventiveMaintenanceLogInput,
  MaintenanceReminder,
  MaintenanceFilters,
  PaginationParams,
  PaginatedResponse
} from './types';
import { WhatsAppService } from '../whatsapp/service';

export class MaintenanceService {
  private whatsappService: WhatsAppService;
  private io: any;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  setIo(io: any) {
    this.io = io;
    this.whatsappService.setIo(io);
  }

  // ============================================
  // PREVENTIVE MAINTENANCE TEMPLATES
  // ============================================

  async createTemplate(tenantId: string, data: CreatePreventiveMaintenanceTemplateInput): Promise<PreventiveMaintenanceTemplate> {
    const template = await prisma.preventiveMaintenanceTemplate.create({
      data: {
        tenantId,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        intervalKm: data.intervalKm,
        intervalMonths: data.intervalMonths,
        priorityKm: data.priorityKm,
        priorityMonths: data.priorityMonths,
        maxDelayKm: data.maxDelayKm,
        maxDelayMonths: data.maxDelayMonths,
        isActive: data.isActive ?? true,
      },
    });

    return template as PreventiveMaintenanceTemplate;
  }

  async getTemplates(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<PreventiveMaintenanceTemplate>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const [data, total] = await Promise.all([
      prisma.preventiveMaintenanceTemplate.findMany({
        where: { tenantId },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.preventiveMaintenanceTemplate.count({ where: { tenantId } }),
    ]);

    return {
      data: data as PreventiveMaintenanceTemplate[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTemplateById(tenantId: string, templateId: string): Promise<PreventiveMaintenanceTemplate> {
    const template = await prisma.preventiveMaintenanceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error('Preventive maintenance template not found');
    }

    return template as PreventiveMaintenanceTemplate;
  }

  async updateTemplate(tenantId: string, templateId: string, data: UpdatePreventiveMaintenanceTemplateInput): Promise<PreventiveMaintenanceTemplate> {
    // Verify template exists and belongs to tenant
    const existingTemplate = await prisma.preventiveMaintenanceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!existingTemplate) {
      throw new Error('Preventive maintenance template not found');
    }

    const template = await prisma.preventiveMaintenanceTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        intervalKm: data.intervalKm,
        intervalMonths: data.intervalMonths,
        priorityKm: data.priorityKm,
        priorityMonths: data.priorityMonths,
        maxDelayKm: data.maxDelayKm,
        maxDelayMonths: data.maxDelayMonths,
        isActive: data.isActive,
      },
    });

    return template as PreventiveMaintenanceTemplate;
  }

  async deleteTemplate(tenantId: string, templateId: string): Promise<void> {
    // Verify template exists and belongs to tenant
    const template = await prisma.preventiveMaintenanceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error('Preventive maintenance template not found');
    }

    await prisma.preventiveMaintenanceTemplate.delete({
      where: { id: templateId },
    });
  }

  // ============================================
  // PREVENTIVE MAINTENANCE LOGS
  // ============================================

  async createLog(tenantId: string, data: CreatePreventiveMaintenanceLogInput): Promise<PreventiveMaintenanceLog> {
    // Verify template exists and belongs to tenant
    const template = await prisma.preventiveMaintenanceTemplate.findFirst({
      where: { id: data.templateId, tenantId },
    });

    if (!template) {
      throw new Error('Preventive maintenance template not found');
    }

    // Verify vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const log = await prisma.preventiveMaintenanceLog.create({
      data: {
        tenantId,
        templateId: data.templateId,
        vehicleId: data.vehicleId,
        scheduledKm: data.scheduledKm,
        scheduledDate: data.scheduledDate,
        status: 'SCHEDULED',
        isDelayed: false,
        notes: data.notes,
      },
    });

    return log as PreventiveMaintenanceLog;
  }

  async getLogs(
    tenantId: string,
    filters: MaintenanceFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<PreventiveMaintenanceLog>> {
    const { page = 1, limit = 10, sortBy = 'scheduledDate', sortOrder = 'asc' } = pagination;
    const { customerId, vehicleId, templateId, status, dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (templateId) {
      where.templateId = templateId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) {
        where.scheduledDate.gte = dateFrom;
      }
      if (dateTo) {
        where.scheduledDate.lte = dateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.preventiveMaintenanceLog.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.preventiveMaintenanceLog.count({ where }),
    ]);

    return {
      data: data as PreventiveMaintenanceLog[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLogById(tenantId: string, logId: string): Promise<PreventiveMaintenanceLog> {
    const log = await prisma.preventiveMaintenanceLog.findFirst({
      where: { id: logId, tenantId },
      include: {
        template: true,
        vehicle: {
          include: {
            customer: true,
          },
        },
        attachments: true,
      },
    });

    if (!log) {
      throw new Error('Preventive maintenance log not found');
    }

    return log as PreventiveMaintenanceLog;
  }

  async updateLog(tenantId: string, logId: string, data: UpdatePreventiveMaintenanceLogInput): Promise<PreventiveMaintenanceLog> {
    // Verify log exists and belongs to tenant
    const existingLog = await prisma.preventiveMaintenanceLog.findFirst({
      where: { id: logId, tenantId },
    });

    if (!existingLog) {
      throw new Error('Preventive maintenance log not found');
    }

    const log = await prisma.preventiveMaintenanceLog.update({
      where: { id: logId },
      data: {
        actualKm: data.actualKm,
        actualDate: data.actualDate,
        status: data.status,
        isDelayed: data.isDelayed,
        delayReason: data.delayReason,
        notes: data.notes,
      },
    });

    return log as PreventiveMaintenanceLog;
  }

  async deleteLog(tenantId: string, logId: string): Promise<void> {
    // Verify log exists and belongs to tenant
    const log = await prisma.preventiveMaintenanceLog.findFirst({
      where: { id: logId, tenantId },
    });

    if (!log) {
      throw new Error('Preventive maintenance log not found');
    }

    await prisma.preventiveMaintenanceLog.delete({
      where: { id: logId },
    });
  }

  // ============================================
  // MAINTENANCE REMINDERS
  // ============================================

  async sendReminders(tenantId: string, daysAhead: number = 7): Promise<number> {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const logs = await prisma.preventiveMaintenanceLog.findMany({
      where: {
        tenantId,
        scheduledDate: {
          gte: now,
          lte: reminderDate,
        },
        status: 'SCHEDULED',
      },
      include: {
        template: true,
        vehicle: {
          include: {
            customer: true,
          },
        },
      },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    let sentCount = 0;

    for (const log of logs) {
      const reminder: MaintenanceReminder = {
        logId: log.id,
        customerId: log.vehicle.customer.id,
        customerName: log.vehicle.customer.fullName,
        customerPhone: log.vehicle.customer.phone,
        vehicleId: log.vehicle.id,
        vehicleMake: log.vehicle.make,
        vehicleModel: log.vehicle.model,
        templateName: log.template.name,
        scheduledKm: log.scheduledKm,
        scheduledDate: log.scheduledDate.toISOString(),
        garageName: tenant.name,
      };

      try {
        await this.whatsappService.sendMaintenanceReminder(reminder);
        sentCount++;
      } catch (error) {
        Logger.error(`Failed to send reminder for log ${log.id}`, error);
      }
    }

    return sentCount;
  }

  async getUpcomingMaintenances(tenantId: string, days: number = 30): Promise<PreventiveMaintenanceLog[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const logs = await prisma.preventiveMaintenanceLog.findMany({
      where: {
        tenantId,
        scheduledDate: {
          gte: now,
          lte: futureDate,
        },
        status: 'SCHEDULED',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return logs as PreventiveMaintenanceLog[];
  }

  // ============================================
  // MAINTENANCE COMPLETION
  // ============================================

  async completeMaintenance(tenantId: string, logId: string, actualKm: number): Promise<PreventiveMaintenanceLog> {
    // Verify log exists and belongs to tenant
    const log = await prisma.preventiveMaintenanceLog.findFirst({
      where: { id: logId, tenantId },
      include: {
        template: true,
        vehicle: true,
      },
    });

    if (!log) {
      throw new Error('Preventive maintenance log not found');
    }

    // Update log to completed
    const updatedLog = await prisma.preventiveMaintenanceLog.update({
      where: { id: logId },
      data: {
        status: 'COMPLETED',
        actualKm: actualKm,
        actualDate: new Date(),
      },
    });

    // Create next log based on template
    const nextKm = actualKm + log.template.intervalKm;
    const nextDate = new Date();
    if (log.template.intervalMonths) {
      nextDate.setMonth(nextDate.getMonth() + log.template.intervalMonths);
    }

    await prisma.preventiveMaintenanceLog.create({
      data: {
        tenantId,
        templateId: log.templateId,
        vehicleId: log.vehicleId,
        scheduledKm: nextKm,
        scheduledDate: nextDate,
        status: 'SCHEDULED',
        isDelayed: false,
      },
    });

    return updatedLog as PreventiveMaintenanceLog;
  }
}
