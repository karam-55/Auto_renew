import prisma from '../../config/database';
import { CreateCustomerInput, UpdateCustomerInput, CustomerResponse } from './types';
import { WhatsAppService } from '../whatsapp/service';
import { TelegramAdminNotificationService } from '../notifications/telegram-admin-notification.service';
import { Logger } from '../../infrastructure/logging/logger';

export class CustomerService {
  private telegramAdminNotificationService = new TelegramAdminNotificationService();
  async getAllCustomers(tenantId: string, skip?: number, limit?: number): Promise<CustomerResponse[]> {
    const customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        phone: true,
        address: true,
        city: true,
        notes: true,
        loyaltyPoints: true,
        isVip: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: skip || undefined,
      take: limit || undefined,
    });

    // Normalize old records
    return customers.map(customer => ({
      ...customer,
      city: customer.city ?? '',
      notes: customer.notes ?? '',
      loyaltyPoints: customer.loyaltyPoints ?? 0,
      isVip: customer.isVip ?? false,
      createdAt: customer.createdAt ?? new Date(),
      updatedAt: customer.updatedAt ?? new Date(),
    }));
  }

  async getCustomersCount(tenantId: string): Promise<number> {
    return prisma.customer.count({ where: { tenantId, deletedAt: null } });
  }

  async getCustomerById(tenantId: string, customerId: string): Promise<CustomerResponse | null> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId, deletedAt: null },
      include: {
        vehicles: {
          select: {
            id: true,
            make: true,
            model: true,
            licensePlate: true,
            year: true,
            color: true,
          },
        },
      },
    });

    if (!customer) return null;

    const { vehicles, ...rest } = customer;
    return {
      ...rest,
      vehicles: vehicles.map((v: any) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        licensePlate: v.licensePlate,
        year: v.year,
        color: v.color,
      })),
    } as any;
  }

  async searchCustomers(tenantId: string, query: string): Promise<CustomerResponse[]> {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        phone: true,
        address: true,
        city: true,
        notes: true,
        loyaltyPoints: true,
        isVip: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers;
  }

  async createCustomer(tenantId: string, data: CreateCustomerInput): Promise<CustomerResponse> {
    // Check if phone already exists in this tenant (exclude soft-deleted)
    const existingCustomer = await prisma.customer.findFirst({
      where: { tenantId, phone: data.phone, deletedAt: null },
    });

    if (existingCustomer) {
      throw new Error('Customer with this phone number already exists');
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        notes: data.notes,
        loyaltyPoints: data.loyaltyPoints ?? 0,
        isVip: data.isVip ?? false,
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        phone: true,
        address: true,
        city: true,
        notes: true,
        loyaltyPoints: true,
        isVip: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send WhatsApp welcome message
    try {
      const whatsappService = new WhatsAppService();
      await whatsappService.sendWelcomeMessage(
        customer.fullName,
        customer.phone,
        'أوتو برو'
      );
    } catch (error) {
      Logger.error('Error sending WhatsApp welcome message:', error);
      // Don't fail customer creation if WhatsApp fails
    }

    // Send Telegram notification to owners/managers about new customer
    setImmediate(async () => {
      try {
        await this.telegramAdminNotificationService.notifyCustomerRegistered(tenantId, customer);
      } catch (telegramError) {
        Logger.error('Error sending Telegram admin notification for customer registration:', telegramError);
      }
    });

    return customer;
  }

  async updateCustomer(tenantId: string, customerId: string, data: UpdateCustomerInput): Promise<CustomerResponse> {
    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // If updating phone, check if new phone is available (exclude soft-deleted)
    if (data.phone && data.phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: { tenantId, phone: data.phone, deletedAt: null },
      });

      if (phoneExists) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        notes: data.notes,
        loyaltyPoints: data.loyaltyPoints,
        isVip: data.isVip,
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        phone: true,
        address: true,
        city: true,
        notes: true,
        loyaltyPoints: true,
        isVip: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return customer;
  }

  async deleteCustomer(tenantId: string, customerId: string): Promise<void> {
    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check if customer has ACTIVE bookings (PENDING, CONFIRMED, IN_PROGRESS, WAITING_PARTS, READY)
    const activeBookings = await prisma.booking.count({
      where: {
        customerId,
        tenantId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'WAITING_PARTS', 'READY'] },
      },
    });

    if (activeBookings > 0) {
      throw new Error('لا يمكن حذف العميل لأنه لديه حجوزات نشطة. يجب حذف الحجز النشط أولاً');
    }

    // Soft delete completed/cancelled bookings for this customer
    await prisma.booking.deleteMany({
      where: {
        customerId,
        tenantId,
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
    });

    // Soft delete all vehicles for this customer
    await prisma.vehicle.deleteMany({
      where: { customerId, tenantId },
    });

    // Soft delete customer
    await prisma.customer.delete({
      where: { id: customerId },
    });
  }

  async addLoyaltyPoints(tenantId: string, customerId: string, points: number): Promise<CustomerResponse> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        phone: true,
        address: true,
        city: true,
        notes: true,
        loyaltyPoints: true,
        isVip: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedCustomer;
  }
}
