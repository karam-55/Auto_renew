import prisma from '../../config/database';
import { Prisma, Service, BookingStatus } from '@prisma/client';
import { CreateBookingInput, UpdateBookingInput, BookingResponse } from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { WhatsAppService } from '../whatsapp/service';
import { FCMService } from '../fcm/service';
import { ScheduleService } from '../schedule/schedule.service';
import { VehicleService } from '../vehicles/service';
import { VehicleService as VehicleManagementService } from '../vehicles/vehicle.service';
import { InvoiceService } from '../invoices/service';
import { Server as SocketIOServer } from 'socket.io';
import { PublicToken } from '../../domain/bookings/value-objects/PublicToken';

export class BookingService {
  private io: SocketIOServer | null = null;
  private whatsappService: WhatsAppService;
  private fcmService: FCMService;
  private scheduleService: ScheduleService;
  private vehicleService: VehicleService;
  private vehicleManagementService: VehicleManagementService;
  private invoiceService: InvoiceService;

  constructor(io?: SocketIOServer) {
    this.io = io || null;
    this.whatsappService = new WhatsAppService();
    this.fcmService = new FCMService();
    this.scheduleService = new ScheduleService();
    this.vehicleService = new VehicleService();
    this.vehicleManagementService = new VehicleManagementService();
    this.invoiceService = new InvoiceService();
    if (io) {
      this.whatsappService.setIo(io);
      // Meta service does not need Socket.IO
      this.fcmService.setIo(io);
      this.invoiceService.setIo(io);
    }
  }

  private generatePublicToken(): string {
    return PublicToken.generate().getValue();
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
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

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
                category: true,
                duration: true,
                basePrice: true,
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
      take: limit,
    });

    // Transform services to match response format
    return bookings.map((booking) => ({
      ...booking,
      services: booking.bookingServices ? booking.bookingServices.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        category: typeof bs.service.category === 'object' && bs.service.category ? bs.service.category.name : bs.service.category || '',
        duration: bs.service.duration || 0,
        basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
      })) : [],
      mechanicAssignments: booking.mechanicAssignments?.length ? [{
        id: booking.mechanicAssignments[0].id,
        mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
        mechanic: booking.mechanicAssignments[0].mechanic,
      }] : [],
    }));
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
                category: true,
                duration: true,
                basePrice: true,
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

    return {
      ...booking,
      services: booking.bookingServices ? booking.bookingServices.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        category: typeof bs.service.category === 'object' && bs.service.category ? bs.service.category.name : bs.service.category || '',
        duration: bs.service.duration || 0,
        basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
      })) : [],
      mechanicAssignments: booking.mechanicAssignments?.length ? [{
        id: booking.mechanicAssignments[0].id,
        mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
        mechanic: booking.mechanicAssignments[0].mechanic,
      }] : [],
    };
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
                category: true,
                duration: true,
                basePrice: true,
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

    return mechanicBookings.map((booking) => ({
      ...booking,
      services: booking.bookingServices ? booking.bookingServices.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        category: typeof bs.service.category === 'object' && bs.service.category ? bs.service.category.name : bs.service.category || '',
        duration: bs.service.duration || 0,
        basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
      })) : [],
      mechanicAssignments: booking.mechanicAssignments?.length ? [{
        id: booking.mechanicAssignments[0].id,
        mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
        mechanic: booking.mechanicAssignments[0].mechanic,
      }] : [],
    }));
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

    // Verify services exist and belong to tenant
    let services: Service[] = [];
    if (data.serviceIds && data.serviceIds.length > 0) {
      services = await prisma.service.findMany({
        where: {
          id: { in: data.serviceIds },
          tenantId,
          isActive: true,
        },
      });

      if (services.length !== data.serviceIds.length) {
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
        bookingServices: data.serviceIds && data.serviceIds.length > 0
          ? {
              create: services.map(service => ({
                serviceId: service.id,
                priceSYP: service.priceSYP ?? service.basePrice ?? 0,
                priceUSD: service.priceUSD ?? 0,
              })),
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
                category: true,
                duration: true,
                basePrice: true,
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
    const bookingResult = {
      ...booking,
      services: booking.bookingServices ? booking.bookingServices.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        category: typeof bs.service.category === 'object' && bs.service.category ? bs.service.category.name : bs.service.category || '',
        duration: bs.service.duration || 0,
        basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
      })) : [],
      mechanicAssignments: booking.mechanicAssignments?.length ? [{
        id: booking.mechanicAssignments[0].id,
        mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
        mechanic: booking.mechanicAssignments[0].mechanic,
      }] : [],
    };

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

      // 5. Auto-create invoice + journal entry
      if (booking.bookingServices && booking.bookingServices.length > 0) {
        try {
          const invoiceItems = booking.bookingServices.map((bs: any) => ({
            serviceId: bs.serviceId,
            description: bs.service?.name || 'خدمة',
            quantity: 1,
            priceSYP: Number(bs.priceSYP || bs.service?.basePrice || 0),
            priceUSD: bs.priceUSD ? Number(bs.priceUSD) : undefined,
          }));
          const invoice = await this.invoiceService.createInvoice(tenantId, createdById || '', {
            customerId: data.customerId,
            bookingId: booking.id,
            invoiceDate: new Date(),
            items: invoiceItems,
          });
          await this.invoiceService.finalizeInvoice(tenantId, invoice.id);
        } catch (error) {
          Logger.error('Error creating auto invoice for booking:', error);
        }
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

    // If updating services, verify they exist and belong to tenant
    let services: Service[] = [];
    if (data.serviceIds) {
      services = await prisma.service.findMany({
        where: {
          id: { in: data.serviceIds },
          tenantId,
          isActive: true,
        },
      });

      if (services.length !== data.serviceIds.length) {
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
        bookingServices: data.serviceIds
          ? {
              deleteMany: {},
              create: services.map(service => ({
                serviceId: service.id,
                priceSYP: service.priceSYP ?? service.basePrice ?? 0,
                priceUSD: service.priceUSD ?? 0,
              })),
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
                category: true,
                duration: true,
                basePrice: true,
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

    // Auto-update invoice when booking services change
    if (data.serviceIds && booking.bookingServices) {
      try {
        const existingInvoice = await prisma.invoice.findFirst({
          where: { bookingId, tenantId },
          orderBy: { createdAt: 'desc' },
        });
        if (existingInvoice) {
          const invoiceItems = booking.bookingServices.map((bs: any) => ({
            serviceId: bs.serviceId,
            description: bs.service?.name || 'خدمة',
            quantity: 1,
            priceSYP: Number(bs.priceSYP || bs.service?.basePrice || 0),
            priceUSD: bs.priceUSD ? Number(bs.priceUSD) : undefined,
          }));
          await this.invoiceService.updateInvoice(tenantId, existingInvoice.id, {
            items: invoiceItems,
          });
        }
      } catch (error) {
        Logger.error('Error auto-updating invoice for booking:', error);
        // Don't fail the booking update if invoice update fails
      }
    }

    return {
      ...booking,
      services: booking.bookingServices ? booking.bookingServices.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        category: typeof bs.service.category === 'object' && bs.service.category ? bs.service.category.name : bs.service.category || '',
        duration: bs.service.duration || 0,
        basePrice: bs.service.basePrice ? Number(bs.service.basePrice) : 0,
      })) : [],
      mechanicAssignments: booking.mechanicAssignments?.length ? [{
        id: booking.mechanicAssignments[0].id,
        mechanicUserId: booking.mechanicAssignments[0].mechanicUserId,
        mechanic: booking.mechanicAssignments[0].mechanic,
      }] : [],
    };
  }

  async addServiceToBooking(tenantId: string, bookingId: string, serviceId: string): Promise<BookingResponse> {
    // Check if booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

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
