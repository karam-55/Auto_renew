import prisma from '../../config/database';
import { WhatsAppService } from '../../api/services/whatsapp.service';
import { Logger } from '../../infrastructure/logging/logger';

export class LoyaltyService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async addPoints(data: {
    tenantId: string;
    customerId: string;
    points: number;
    source: 'INVOICE' | 'MEMBERSHIP' | 'MANUAL';
    reference?: string;
  }) {
    // Get customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId: data.tenantId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create transaction
    await prisma.loyaltyPointTransaction.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        points: data.points,
        type: 'EARNED',
        source: data.source,
        reference: data.reference,
      },
    });

    // Update customer loyalty points
    const newPoints = customer.loyaltyPoints + data.points;
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { loyaltyPoints: newPoints },
    });

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendPointsEarned(
        data.tenantId,
        customer.phone,
        data.points
      );
    } catch (error) {
      Logger.error('Failed to send WhatsApp notification:', error);
    }

    return newPoints;
  }

  async redeemPoints(data: {
    tenantId: string;
    customerId: string;
    points: number;
    reference?: string;
  }) {
    // Get customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        tenantId: data.tenantId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < data.points) {
      throw new Error('Insufficient loyalty points');
    }

    // Create transaction
    await prisma.loyaltyPointTransaction.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        points: data.points,
        type: 'REDEEMED',
        source: 'MANUAL',
        reference: data.reference,
      },
    });

    // Update customer loyalty points
    const newPoints = customer.loyaltyPoints - data.points;
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { loyaltyPoints: newPoints },
    });

    // Send WhatsApp notification
    try {
      await this.whatsappService.sendPointsRedeemed(
        data.tenantId,
        customer.phone,
        data.points
      );
    } catch (error) {
      Logger.error('Failed to send WhatsApp notification:', error);
    }

    return newPoints;
  }

  async getCustomerPoints(customerId: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
      select: {
        loyaltyPoints: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer.loyaltyPoints;
  }

  async getPointTransactions(customerId: string, tenantId: string, limit = 50) {
    return await prisma.loyaltyPointTransaction.findMany({
      where: {
        customerId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async calculatePointsFromInvoice(total: number) {
    // Earn points = invoice.total / 100
    return Math.floor(total / 100);
  }

  async calculateDiscountFromPoints(points: number) {
    // 1 point = 100 ل.س
    return points * 100;
  }

  async getAllCustomersWithPoints(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
      },
      orderBy: {
        loyaltyPoints: 'desc',
      },
    });

    return customers.map(customer => ({
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      points: customer.loyaltyPoints,
    }));
  }
}
