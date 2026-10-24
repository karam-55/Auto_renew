import prisma from '../../config/database';
import { Prisma, Service, BookingStatus } from '@prisma/client';
import { CreateBookingInput, UpdateBookingInput, BookingResponse, BookingServiceInput } from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { WhatsAppService } from '../whatsapp/service';
import { FCMService } from '../fcm/service';
import { TelegramAdminNotificationService } from '../notifications/telegram-admin-notification.service';
import { ScheduleService } from '../schedule/schedule.service';
import { VehicleService } from '../vehicles/service';
import { VehicleService as VehicleManagementService } from '../vehicles/vehicle.service';
import { Server as SocketIOServer } from 'socket.io';
import { PublicToken } from '../../domain/bookings/value-objects/PublicToken';
import { isValidQuantity } from '../../utils/quantity';
import settingsService from '../../services/settings.service';
import { createStockConsumptionJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';

export class BookingService {
  private io: SocketIOServer | null = null;
  private whatsappService: WhatsAppService;
  private fcmService: FCMService;
  private telegramAdminNotificationService: TelegramAdminNotificationService;
  private scheduleService: ScheduleService;
  private vehicleService: VehicleService;
  private vehicleManagementService: VehicleManagementService;

  constructor(io?: SocketIOServer) {
    this.io = io || null;
    this.whatsappService = new WhatsAppService();
    this.fcmService = new FCMService();
    this.telegramAdminNotificationService = new TelegramAdminNotificationService();
    this.scheduleService = new ScheduleService();
    this.vehicleService = new VehicleService();
    this.vehicleManagementService = new VehicleManagementService();
    if (io) {
      this.whatsappService.setIo(io);
      // Meta service does not need Socket.IO
      this.fcmService.setIo(io);
    }
  }

  private generatePublicToken(): string {
    return PublicToken.generate().getValue();
  }

  /**
   * Build the nested-create payload for one BookingService line, including
   * type-specific validation. Prices and materials are finalized in the linked
   * work order, not while the receptionist is creating the booking.
   */
  private buildBookingServiceCreate(input: BookingServiceInput, svc: Service): any {
    const type = (svc as any).serviceType || 'STANDARD';

    const quantity = input.quantity == null ? 1 : Number(input.quantity);
    if (!isValidQuantity(quantity)) throw new Error('Service quantity must be positive and use at most three decimal places');

    const data: any = {
      serviceId: input.serviceId,
      quantity,
      priceSYP: 0,
      priceUSD: 0,
      priceFinalized: false,
      customName: input.customName || undefined,
      panels: Array.isArray(input.panels) ? input.panels.join(', ') : (input.panels || undefined),
    };

    if (type === 'CUSTOM' && !input.customName?.trim()) {
      throw new Error('Custom service requires a name');
    }
    if (type === 'PANELS' && (!input.panels || (Array.isArray(input.panels) && input.panels.length === 0))) {
      throw new Error('Denting service requires selecting at least one panel');
    }
    if (input.materials && input.materials.length > 0) {
      if (input.materials.some((material) => !isValidQuantity(Number(material.quantity)))) {
        throw new Error('Material quantities must be positive and use at most three decimal places');
      }
      data.materials = {
        create: input.materials
          .filter((m) => m.partId && Number(m.quantity) > 0)
          .map((m) => ({ partId: m.partId, quantity: Number(m.quantity) })),
      };
    }

    return data;
  }

  /**
   * Map a Prisma booking row (with bookingServices + relations included) to the
   * BookingResponse shape, including per-line prices and booking totals.
   */
  private mapBookingResponse(booking: any): BookingResponse {
    const services = booking.bookingServices
      ? booking.bookingServices.map((bs: any) => ({
          bookingServiceId: bs.id,
          id: bs.service.id,
          name: bs.customName || bs.service.name,
          quantity: Number(bs.quantity),
          serviceType: bs.service.serviceType || 'STANDARD',
          panels: bs.panels || undefined,
          materials: (bs.materials || []).map((m: any) => ({
            id: m.id,
            partId: m.partId,
            quantity: Number(m.quantity),
            issuedQuantity: Number(m.issuedQuantity || 0),
            partName: m.part?.name || m.part?.nameAr || undefined,
          })),
          category:
            typeof bs.service.category === 'object' && bs.service.category
              ? bs.service.category.name
              : bs.service.category || '',
          duration: bs.service.duration || 0,
          basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
          priceSYP:
            bs.priceSYP !== null && bs.priceSYP !== undefined
              ? Number(bs.priceSYP)
              : (bs.service.basePrice ? Number(bs.service.basePrice) : 0),
          priceUSD:
            bs.priceUSD !== null && bs.priceUSD !== undefined
              ? Number(bs.priceUSD)
              : null,
          priceFinalized: !!bs.priceFinalized,
        }))
      : [];

    const totalSYP = services.reduce((sum: number, s: any) => sum + (s.priceSYP || 0) * (s.quantity || 1), 0);
    const totalUSD = services.some((s: any) => s.priceUSD !== null)
      ? services.reduce((sum: number, s: any) => sum + (s.priceUSD || 0) * (s.quantity || 1), 0)
      : null;

    return {
      ...booking,
      services,
      totalSYP,
      totalUSD,
      mechanicAssignments: booking.mechanicAssignments?.length
        ? [{
            id: booking.mechanicAssignments[0].id,
            mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
            mechanic: booking.mechanicAssignments[0].mechanic,
          }]
        : [],
    };
  }

  async getAllBookings(tenantId: string, filters?: {
    status?: string;
    customerId?: string;
    vehicleId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<BookingResponse[]> {
    const where: Prisma.BookingWhereInput = { tenantId };

    if (filters?.status) {
      where.status = filters.status as BookingStatus;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledDate = {};
      if (filters.dateFrom) {
        where.scheduledDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.scheduledDate.lte = filters.dateTo;
      }
    }

    const page = filters?.page || 1;
    // limit === 0 means "all rows" (lookup mode). Default to 50 for list views.
    const limit = filters?.limit ?? 50;
    const isLookupAll = limit === 0;
    const skip = isLookupAll ? 0 : (page - 1) * limit;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                serviceType: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
            materials: {
              include: {
                part: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
        mechanicAssignments: {
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
      skip,
      // limit === 0 → "all rows": omit take so Prisma returns everything.
      take: isLookupAll ? undefined : limit,
    });

    // Transform services to match response format
    return bookings.map((booking) => this.mapBookingResponse(booking));
  }

  async getBookingsCount(tenantId: string, filters?: {
    status?: string;
    customerId?: string;
    vehicleId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<number> {
    const where: Prisma.BookingWhereInput = { tenantId };

    if (filters?.status) {
      where.status = filters.status as BookingStatus;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.scheduledDate = {};
      if (filters.dateFrom) {
        where.scheduledDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.scheduledDate.lte = filters.dateTo;
      }
    }

    return prisma.booking.count({ where });
  }

  async getBookingById(tenantId: string, bookingId: string): Promise<BookingResponse | null> {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        vehicleId: true,
        status: true,
        publicToken: true,
        notes: true,
        estimatedCompletionDate: true,
        actualCompletionDate: true,
        createdAt: true,
        updatedAt: true,
        priority: true,
        scheduledDate: true,
        scheduledTime: true,
        workOrder: { select: { id: true, status: true } },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                serviceType: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
            materials: {
              include: {
                part: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
        mechanicAssignments: {
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return null;
    }

    return this.mapBookingResponse(booking);
  }

  async issueWorkOrderMaterials(
    tenantId: string,
    bookingId: string,
    userId: string,
    requestedItems: Array<{ materialId: string; quantity: number }>,
    idempotencyKey: string
  ) {
    if (!idempotencyKey?.trim() || idempotencyKey.length > 128) throw new Error('A valid issue request key is required');
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
      throw new Error('Select the actual materials and quantities to issue');
    }
    if (requestedItems.some((item) => !item.materialId || !isValidQuantity(Number(item.quantity)))) {
      throw new Error('Each issued material needs a positive quantity with at most three decimal places');
    }
    if (new Set(requestedItems.map((item) => item.materialId)).size !== requestedItems.length) {
      throw new Error('A material can appear only once per issue request');
    }

    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, tenantId, deletedAt: null },
        include: {
          bookingServices: {
            where: { deletedAt: null },
            include: {
              service: { include: { category: { select: { costCenterId: true } } } },
              materials: { include: { part: true } },
            },
          },
        },
      });
      if (!booking) throw new Error('Booking not found');
      if (['CANCELLED', 'COMPLETED', 'DELIVERED', 'INVOICED', 'PAID'].includes(booking.status)) {
        throw new Error('Materials cannot be issued for a closed or cancelled work order');
      }

      await ensureDefaultAccounts(tenantId, tx);
      const materialsById = new Map<string, { bookingService: any; material: any }>();
      for (const bookingService of booking.bookingServices) {
        for (const material of bookingService.materials) {
          materialsById.set(material.id, { bookingService, material });
        }
      }
      const issued: Array<Record<string, unknown>> = [];
      let totalCostSYP = 0;
      let totalCostUSD = 0;

      for (const requested of requestedItems) {
        const source = materialsById.get(requested.materialId);
        if (!source) throw new Error('Selected material does not belong to this work order');
        const { bookingService, material } = source;
        const quantity = Number(requested.quantity);
        const movementKey = `WO-MATERIAL:${idempotencyKey}:${material.id}`;
        const existingMovement = await tx.inventoryTransaction.findFirst({
          where: { tenantId, idempotencyKey: movementKey },
        });
        if (existingMovement) {
          if (existingMovement.partId !== material.partId || Number(existingMovement.quantity) !== quantity) {
            throw new Error('Issue request key was already used with different material quantities');
          }
          continue;
        }
        const remaining = Math.round((Number(material.quantity) - Number(material.issuedQuantity)) * 1000) / 1000;
        if (quantity > remaining) {
          throw new Error(`Issue quantity exceeds the remaining planned quantity for ${material.part.name || 'material'}`);
        }
        if (material.part.tenantId !== tenantId || material.part.deletedAt) {
          throw new Error(`Material ${material.partId} is unavailable`);
        }

        const unitCostUSD = material.part.costUSD != null
          ? Number(material.part.costUSD)
          : Math.round((Number(material.part.costSYP) / exchangeRate) * 100) / 100;
        const unitCostSYP = material.part.costUSD != null
          ? Math.round(unitCostUSD * exchangeRate)
          : Number(material.part.costSYP);
        const issueTotalSYP = Math.round(unitCostSYP * quantity * 100) / 100;
        const issueTotalUSD = Math.round(unitCostUSD * quantity * 100) / 100;

        const stockUpdate = await tx.part.updateMany({
          where: { id: material.partId, tenantId, quantity: { gte: quantity } },
          data: { quantity: { decrement: quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new Error(`Insufficient stock for ${material.part.name || material.part.nameAr || 'material'}`);
        }

        const targetIssued = Math.round((Number(material.issuedQuantity) + quantity) * 1000) / 1000;
        const materialUpdate = await tx.bookingServiceMaterial.updateMany({
          where: { id: material.id, issuedQuantity: material.issuedQuantity },
          data: {
            issuedQuantity: targetIssued,
            issuedCostSYP: { increment: issueTotalSYP },
            issuedCostUSD: { increment: issueTotalUSD },
            issuedAt: new Date(),
          },
        });
        if (materialUpdate.count !== 1) throw new Error('Material issue changed concurrently; retry');

        const inventoryTransaction = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            partId: material.partId,
            type: 'CONSUMPTION',
            quantity,
            costSYP: unitCostSYP,
            costUSD: unitCostUSD,
            reference: `WORKORDER:${bookingId}`,
            notes: `Material issued for work order ${bookingId}`,
            bookingId,
            serviceId: bookingService.serviceId,
            bookingServiceId: bookingService.id,
            bookingServiceMaterialId: material.id,
            costCenterId: bookingService.service.category?.costCenterId || null,
            idempotencyKey: movementKey,
            createdBy: userId,
          },
          include: {
            part: { select: { name: true, nameAr: true } },
            booking: {
              include: {
                customer: { select: { fullName: true } },
                vehicle: { select: { make: true, model: true, licensePlate: true } },
              },
            },
            bookingService: { include: { service: { select: { name: true, nameAr: true } } } },
          },
        });
        await createStockConsumptionJournalEntry(inventoryTransaction, tenantId, userId, tx);

        issued.push({
          bookingServiceId: bookingService.id,
          bookingServiceMaterialId: material.id,
          serviceId: bookingService.serviceId,
          partId: material.partId,
          partName: material.part.name || material.part.nameAr,
          quantity,
          costSYP: issueTotalSYP,
          costUSD: issueTotalUSD,
        });
        totalCostSYP += issueTotalSYP;
        totalCostUSD += issueTotalUSD;
      }

      return { bookingId, issuedCount: issued.length, issued, totalCostSYP, totalCostUSD };
    }, { isolationLevel: 'Serializable' });
  }

  async getBookingsByDate(tenantId: string, date: Date): Promise<BookingResponse[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getAllBookings(tenantId, {
      dateFrom: startOfDay,
      dateTo: endOfDay,
    });
  }

  async getBookingsByMechanic(tenantId: string, mechanicId: string): Promise<BookingResponse[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
      },
      include: {
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                serviceType: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
            materials: {
              include: {
                part: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
        mechanicAssignments: {
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
    });

    // Filter bookings assigned to the specific mechanic
    const mechanicBookings = bookings.filter(booking => 
      booking.mechanicAssignments && 
      booking.mechanicAssignments[0].mechanicUserId === mechanicId
    );

    return mechanicBookings.map((booking) => this.mapBookingResponse(booking));
  }

  async createBooking(tenantId: string, data: CreateBookingInput, createdById?: string): Promise<BookingResponse> {
    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle exists and belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Normalize service inputs: accept either `services` (preferred, with custom prices)
    // or legacy `serviceIds` (uses each service's default price).
    const serviceInputs: BookingServiceInput[] = Array.isArray(data.services) && data.services.length > 0
      ? data.services
      : Array.isArray(data.serviceIds) && data.serviceIds.length > 0
        ? data.serviceIds.map((id) => ({ serviceId: id }))
        : [];

    // Verify services exist and belong to tenant
    let services: Service[] = [];
    if (serviceInputs.length > 0) {
      const serviceIdList = serviceInputs.map((s) => s.serviceId);
      services = await prisma.service.findMany({
        where: {
          id: { in: serviceIdList },
          tenantId,
          isActive: true,
        },
      });

      if (services.length !== serviceIdList.length) {
        throw new Error('One or more services not found or inactive');
      }
    }

    // Convert scheduledDate to Date object if it's a string
    const scheduledDate = data.scheduledDate instanceof Date
      ? data.scheduledDate
      : new Date(data.scheduledDate);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tenantId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        scheduledDate: scheduledDate,
        scheduledTime: data.scheduledTime,
        status: data.status || 'PENDING',
        priority: data.priority || 'NORMAL',
        paymentMethod: data.paymentMethod || 'CASH',
        notes: data.notes,
        publicToken: this.generatePublicToken(),
        bookingServices: serviceInputs.length > 0
          ? {
              create: serviceInputs.map((input) => {
                const svc = services.find((s) => s.id === input.serviceId)!;
                return this.buildBookingServiceCreate(input, svc);
              }),
            }
          : undefined,
        workOrder: {
          create: {
            tenantId,
            status: 'OPEN',
            createdById: createdById || null,
          },
        },
      },
      include: {
        workOrder: { select: { id: true, status: true } },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                serviceType: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
            materials: {
              include: {
                part: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
        mechanicAssignments: {
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Build the response immediately — all side effects run in background
    const bookingResult = this.mapBookingResponse(booking);

    // ── Fire-and-forget side effects (do NOT block the response) ──
    setImmediate(async () => {
      // 1. Socket.io notification
      if (this.io) {
        this.io.to(`tenant:${tenantId}`).emit('booking:created', {
          bookingId: booking.id,
          customerId: booking.customerId,
          vehicleId: booking.vehicleId,
          scheduledDate: booking.scheduledDate,
          status: booking.status,
        });
      }

      // 2. WhatsApp notifications
      const customerPhone = booking.customer?.phone || customer.phone;
      if (customerPhone) {
        const baseUrl = process.env.BASE_URL || process.env.SERVER_URL || '';
        const trackingUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/customer_frontend/?token=${booking.publicToken}` : '';

        try {
          // Check if this is a new customer (first booking ever)
          const previousBookings = await prisma.booking.count({
            where: { customerId: data.customerId, tenantId },
          });
          const isNewCustomer = previousBookings === 1; // Only this booking exists

          // A. Send welcome message for new customers
          if (isNewCustomer) {
            try {
              await this.whatsappService.sendWelcomeMessage(
                booking.customer?.fullName || customer.fullName,
                customerPhone,
                'Garage Go'
              );
            } catch (welcomeError) {
              Logger.error('Error sending WhatsApp welcome message:', welcomeError);
            }
          }

          // B. Send booking confirmation with tracking URL
          await this.whatsappService.sendBookingConfirmation({
            customerName: booking.customer?.fullName || customer.fullName,
            customerPhone,
            bookingId: booking.id,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            scheduledDate: booking.scheduledDate ? booking.scheduledDate.toLocaleDateString('ar-SY') : '',
            status: booking.status,
            garageName: 'Garage Go',
            trackingUrl,
          });
        } catch (error) {
          Logger.error('Error sending WhatsApp booking confirmation:', error);
        }
      }

      // 3. FCM notification to mechanic
      if (booking.mechanicAssignments?.length) {
        try {
          await this.fcmService.sendBookingAssignment({
            mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
            bookingId: booking.id,
            customerName: customer.fullName,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
            scheduledDate: booking.scheduledDate ? booking.scheduledDate.toString() : '',
            priority: booking.priority || 'NORMAL',
          });
        } catch (error) {
          Logger.error('Error sending FCM booking assignment notification:', error);
        }
      }

      // 4. Auto-create schedule if technician assigned
      if (data.technicianId && booking.bookingServices && booking.bookingServices.length > 0) {
        try {
          await this.scheduleService.createScheduleForBooking(
            booking.id,
            tenantId,
            data.technicianId,
            scheduledDate
          );
        } catch (error) {
          Logger.error('Error creating schedule for booking:', error);
        }
      }

      // Invoice creation follows completed work, material issue, and price approval.
      try {
        await this.telegramAdminNotificationService.notifyBookingCreated(tenantId, booking);
      } catch (telegramError) {
        Logger.error('Error sending Telegram admin notification for booking creation:', telegramError);
      }
    });

    return bookingResult;
  }

  async updateBooking(tenantId: string, bookingId: string, data: UpdateBookingInput): Promise<BookingResponse> {
    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    if (data.status === 'COMPLETED') {
      const workOrder = await prisma.workOrder.findFirst({
        where: { tenantId, bookingId },
        select: { status: true },
      });
      if (workOrder && workOrder.status !== 'COMPLETED') {
        throw new Error('Finish the linked work order to complete this booking');
      }
    }

    // If updating customer, verify new customer exists and belongs to tenant
    if (data.customerId && data.customerId !== existingBooking.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // If updating vehicle, verify new vehicle exists and belongs to tenant
    if (data.vehicleId && data.vehicleId !== existingBooking.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, tenantId },
      });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
    }

    // Normalize service inputs for update: accept either `services` (preferred)
    // or legacy `serviceIds`. If neither is provided, leave bookingServices untouched.
    const updateServiceInputs: BookingServiceInput[] = Array.isArray(data.services) && data.services.length > 0
      ? data.services
      : Array.isArray(data.serviceIds) && data.serviceIds.length > 0
        ? data.serviceIds.map((id) => ({ serviceId: id }))
        : [];
    const hasServiceUpdate = Array.isArray(data.services) || Array.isArray(data.serviceIds);

    if (hasServiceUpdate) {
      const workOrder = await prisma.workOrder.findFirst({
        where: { tenantId, bookingId },
        select: { status: true },
      });
      if (workOrder && workOrder.status !== 'OPEN') {
        throw new Error('Services cannot be replaced after work has started');
      }
      const issuedMaterial = await prisma.bookingServiceMaterial.findFirst({
        where: { bookingService: { bookingId, deletedAt: null }, issuedQuantity: { gt: 0 } },
        select: { id: true },
      });
      if (issuedMaterial) {
        throw new Error('Return issued materials before replacing the work-order services');
      }
    }

    // If updating services, verify they exist and belong to tenant
    let services: Service[] = [];
    if (hasServiceUpdate && updateServiceInputs.length > 0) {
      const serviceIdList = updateServiceInputs.map((s) => s.serviceId);
      services = await prisma.service.findMany({
        where: {
          id: { in: serviceIdList },
          tenantId,
          isActive: true,
        },
      });

      if (services.length !== serviceIdList.length) {
        throw new Error('One or more services not found or inactive');
      }
    }

    // Update booking
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        scheduledTime: data.scheduledTime,
        status: data.status,
        priority: data.priority,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        actualCompletionDate: data.status === 'COMPLETED' && !existingBooking.actualCompletionDate
          ? new Date()
          : existingBooking.actualCompletionDate,
        bookingServices: hasServiceUpdate
          ? {
              deleteMany: {},
              create: updateServiceInputs.map((input) => {
                const svc = services.find((s) => s.id === input.serviceId)!;
                return this.buildBookingServiceCreate(input, svc);
              }),
            }
          : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        bookingServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                serviceType: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
            materials: {
              include: {
                part: { select: { id: true, name: true, nameAr: true } },
              },
            },
          },
        },
        workOrder: { select: { id: true, status: true } },
        mechanicAssignments: {
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // If booking status changed to COMPLETED, update vehicle's lastServiceDate
    if (data.status === 'COMPLETED' && existingBooking.status !== 'COMPLETED') {
      await this.vehicleService.updateLastServiceDate(booking.vehicleId, tenantId);
    }

    // Add vehicle history entry when booking status changes
    if (data.status && data.status !== existingBooking.status) {
      await this.vehicleManagementService.addHistoryEntry({
        tenantId,
        vehicleId: booking.vehicleId,
        description: `Booking status changed from ${existingBooking.status} to ${data.status}`,
        type: 'SERVICE',
      });
    }

    // Emit Socket.io notification for status changes
    if (this.io && data.status && data.status !== existingBooking.status) {
      this.io.to(`tenant:${tenantId}`).emit('booking:status-changed', {
        bookingId: booking.id,
        oldStatus: existingBooking.status,
        newStatus: data.status,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
      });

      // Also notify assigned mechanic
      if (booking.mechanicAssignments?.length > 0) {
        this.io.to(`user:${booking.mechanicAssignments[0].mechanicUserId}`).emit('booking:status-changed', {
          bookingId: booking.id,
          oldStatus: existingBooking.status,
          newStatus: data.status,
        });
      }

      // Emit booking-updated event for customer frontend (includes publicToken)
      this.io.to(`booking:${booking.publicToken}`).emit('booking-updated', {
        publicToken: booking.publicToken,
        bookingId: booking.id,
        status: data.status,
      });
    }

    // Send WhatsApp notification for status changes
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: booking.customerId },
        select: { fullName: true, phone: true },
      });

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: booking.vehicleId },
        select: { make: true, model: true },
      });

      if (customer && vehicle) {
        await this.whatsappService.sendBookingStatusUpdate({
          customerName: customer.fullName,
          customerPhone: customer.phone,
          bookingId: booking.id,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          scheduledDate: booking.scheduledDate ? booking.scheduledDate.toLocaleDateString('ar-SY') : '',
          status: data.status || booking.status,
          garageName: 'Garage Go',
        });
      }
    } catch (error) {
      Logger.error('Error sending WhatsApp status update:', error);
      // Don't fail the booking update if WhatsApp fails
    }

    // Send FCM notification to assigned mechanic
    if (booking.mechanicAssignments) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: booking.customerId },
          select: { fullName: true },
        });

        const vehicle = await prisma.vehicle.findUnique({
          where: { id: booking.vehicleId },
          select: { make: true, model: true },
        });

        if (customer && vehicle) {
          await this.fcmService.sendBookingStatusUpdate({
            mechanicUserId: booking.mechanicAssignments?.[0]?.mechanicUserId,
            bookingId: booking.id,
            status: data.status || booking.status,
            customerName: customer.fullName,
            vehicleMake: vehicle.make,
            vehicleModel: vehicle.model,
          });
        }
      } catch (error) {
        Logger.error('Error sending FCM booking status notification:', error);
        // Don't fail the booking update if FCM fails
      }
    }

    // Send Telegram notification to owners/managers when status changes
    if (data.status && data.status !== existingBooking.status) {
      setImmediate(async () => {
        try {
          await this.telegramAdminNotificationService.notifyBookingStatusChanged(
            tenantId,
            booking,
            existingBooking.status,
            data.status || booking.status
          );
        } catch (telegramError) {
          Logger.error('Error sending Telegram admin notification for booking status change:', telegramError);
        }
      });
    }

    return this.mapBookingResponse(booking);
  }

  async addServiceToBooking(tenantId: string, bookingId: string, serviceId: string): Promise<BookingResponse> {
    // Check if booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const issuedMaterial = await prisma.bookingServiceMaterial.findFirst({
      where: {
        bookingService: { bookingId, serviceId, deletedAt: null },
        issuedQuantity: { gt: 0 },
      },
      select: { id: true },
    });
    if (issuedMaterial) throw new Error('Return issued materials before removing this service');

    // Check if service exists
    const service = await prisma.service.findFirst({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Check if service is already added to booking
    const existingBookingService = await prisma.bookingService.findFirst({
      where: {
        bookingId,
        serviceId,
      },
    });

    if (existingBookingService) {
      throw new Error('Service already added to booking');
    }

    // Add service to booking
    await prisma.bookingService.create({
      data: {
        bookingId,
        serviceId,
        priceSYP: service.basePrice?.toString() || '0',
        priceUSD: null,
      },
    });

    // Return updated booking
    const updatedBooking = await this.getBookingById(tenantId, bookingId);
    if (!updatedBooking) {
      throw new Error('Failed to retrieve updated booking');
    }
    return updatedBooking;
  }

  async removeServiceFromBooking(tenantId: string, bookingId: string, serviceId: string): Promise<BookingResponse> {
    // Check if booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Remove service from booking
    await prisma.bookingService.deleteMany({
      where: {
        bookingId,
        serviceId,
      },
    });

    // Return updated booking
    const updatedBooking = await this.getBookingById(tenantId, bookingId);
    if (!updatedBooking) {
      throw new Error('Failed to retrieve updated booking');
    }
    return updatedBooking;
  }

  async deleteBooking(tenantId: string, bookingId: string): Promise<void> {
    // Check if booking exists and belongs to tenant
    const existingBooking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const issuedMaterial = await prisma.bookingServiceMaterial.findFirst({
      where: { bookingService: { bookingId, deletedAt: null }, issuedQuantity: { gt: 0 } },
      select: { id: true },
    });
    if (issuedMaterial) throw new Error('Return issued materials before deleting this work order');

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    // Emit Socket.io notification
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit('booking:deleted', {
        bookingId: bookingId,
      });
    }
  }

  async getDashboardStats(tenantId: string): Promise<{
    totalBookings: number;
    todayBookings: number;
    pendingBookings: number;
    inProgressBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalBookings, todayBookings, pendingBookings, inProgressBookings, completedBookings, cancelledBookings] =
      await Promise.all([
        prisma.booking.count({ where: { tenantId } }),
        prisma.booking.count({
          where: {
            tenantId,
            scheduledDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
        prisma.booking.count({
          where: { tenantId, status: 'PENDING' },
        }),
        prisma.booking.count({
          where: { tenantId, status: 'IN_PROGRESS' },
        }),
        prisma.booking.count({
          where: { tenantId, status: 'COMPLETED' },
        }),
        prisma.booking.count({
          where: { tenantId, status: 'CANCELLED' },
        }),
      ]);

    return {
      totalBookings,
      todayBookings,
      pendingBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
    };
  }
}
