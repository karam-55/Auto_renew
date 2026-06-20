import prisma from '../../config/database';
import { VehicleHistoryType, FaultSeverity, RecommendationStatus } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';
import { WhatsAppService } from '../../api/services/whatsapp.service';

export class VehicleService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }
  /**
   * Add a history entry to a vehicle
   */
  async addHistoryEntry(data: {
    tenantId: string;
    vehicleId: string;
    invoiceId?: string;
    serviceId?: string;
    technicianId?: string;
    description: string;
    type: VehicleHistoryType;
  }) {
    return await prisma.vehicleHistory.create({
      data: {
        tenantId: data.tenantId,
        vehicleId: data.vehicleId,
        invoiceId: data.invoiceId,
        serviceId: data.serviceId,
        technicianId: data.technicianId,
        description: data.description,
        type: data.type,
      },
    });
  }

  /**
   * Update vehicle mileage and recalculate next service date
   */
  async updateMileage(data: {
    tenantId: string;
    vehicleId: string;
    mileage: number;
  }) {
    const vehicle = await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        currentKm: data.mileage,
      },
    });

    // Recalculate next service date based on mileage
    await this.calculateNextServiceDate({
      tenantId: data.tenantId,
      vehicleId: data.vehicleId,
      currentMileage: data.mileage,
    });

    return vehicle;
  }

  /**
   * Calculate next service date based on service intervals
   * Default: 6 months or +5000 km
   */
  async calculateNextServiceDate(data: {
    tenantId: string;
    vehicleId: string;
    currentMileage?: number;
  }) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) return;

    const nextServiceDate = new Date();
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 6); // Default 6 months

    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        nextServiceDate,
      },
    });
  }

  /**
   * Generate recommendations based on service type
   */
  async generateRecommendations(data: {
    tenantId: string;
    vehicleId: string;
    serviceType: string;
    currentMileage?: number;
  }) {
    const recommendations: Array<{
      title: string;
      description: string;
      dueMileage?: number;
      dueDate?: Date;
    }> = [];

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: {
        customer: true,
      },
    });

    if (!vehicle) return;

    const currentMileage = data.currentMileage || vehicle.currentKm || 0;

    // Oil change recommendation
    if (data.serviceType.toLowerCase().includes('oil') || data.serviceType.toLowerCase().includes('تغيير زيت')) {
      recommendations.push({
        title: 'تغيير زيت المحرك القادم',
        description: 'يُنصح بتغيير زيت المحرك بعد 5000 كم',
        dueMileage: currentMileage + 5000,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });
    }

    // Brake pads recommendation
    if (data.serviceType.toLowerCase().includes('brake') || data.serviceType.toLowerCase().includes('فرامل')) {
      recommendations.push({
        title: 'فحص أقراص الفرامل',
        description: 'يُنصح بفحص أقراص الفرامل بعد 10000 كم',
        dueMileage: currentMileage + 10000,
        dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
      });
    }

    // Tires recommendation
    if (data.serviceType.toLowerCase().includes('tire') || data.serviceType.toLowerCase().includes('إطار')) {
      recommendations.push({
        title: 'تدوير الإطارات',
        description: 'يُنصح بتدوير الإطارات بعد 8000 كم',
        dueMileage: currentMileage + 8000,
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
      });
    }

    // General service recommendation
    recommendations.push({
      title: 'خدمة دورية عامة',
      description: 'يُنصح بإجراء خدمة دورية شاملة',
      dueMileage: currentMileage + 10000,
      dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
    });

    // Create recommendations in database
    for (const rec of recommendations) {
      await prisma.vehicleRecommendation.create({
        data: {
          tenantId: data.tenantId,
          vehicleId: data.vehicleId,
          title: rec.title,
          description: rec.description,
          dueMileage: rec.dueMileage,
          dueDate: rec.dueDate,
          status: RecommendationStatus.PENDING,
        },
      });

      // Send WhatsApp notification for each recommendation
      if (vehicle.customer) {
        try {
          await this.whatsappService.sendRecommendationDue(
            data.tenantId,
            vehicle.customer.phone,
            rec.title
          );
        } catch (error) {
          Logger.error('Failed to send WhatsApp notification:', error);
        }
      }
    }
  }

  /**
   * Get vehicle history with optional filters
   */
  async getVehicleHistory(vehicleId: string, filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { vehicleId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.vehicleHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });
  }

  /**
   * Get vehicle faults
   */
  async getVehicleFaults(vehicleId: string) {
    return await prisma.vehicleFault.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get vehicle attachments
   */
  async getVehicleAttachments(vehicleId: string) {
    return await prisma.vehicleAttachment.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get vehicle recommendations
   */
  async getVehicleRecommendations(vehicleId: string) {
    return await prisma.vehicleRecommendation.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
