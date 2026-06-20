import prisma from '../../config/database';
import { WhatsAppService } from '../../api/services/whatsapp.service';
import { Logger } from '../../infrastructure/logging/logger';
import settingsService from '../../services/settings.service';

export class MembershipService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async purchaseMembership(data: {
    tenantId: string;
    customerId: string;
    membershipPlanId: string;
  }) {
    // Get settings to check membership scope
    const settings = await settingsService.getSettings(data.tenantId);
    const membershipScope = settings.membershipScope || 'GLOBAL';

    // Get the membership plan
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: data.membershipPlanId,
        tenantId: data.tenantId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new Error('Membership plan not found or inactive');
    }

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

    // Check if customer has an active membership
    // If membershipScope is GLOBAL, check across all branches
    // If membershipScope is BRANCH, check only within the same branch
    const activeMembershipQuery: any = {
      customerId: data.customerId,
      status: 'ACTIVE',
    };

    // Note: Customer doesn't have branchId in current schema, skipping branch-specific check

    const activeMembership = await prisma.customerMembership.findFirst({
      where: activeMembershipQuery,
    });

    if (activeMembership) {
      throw new Error('Customer already has an active membership');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Create customer membership
    const membership = await prisma.customerMembership.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        membershipPlanId: data.membershipPlanId,
        startDate,
        endDate,
        remainingVisits: plan.includedVisits,
        status: 'ACTIVE',
        // autoRenew: settings.membershipAutoRenew || false, // Field not in schema
      },
      include: {
        membershipPlan: true,
      },
    });

    // Add loyalty points based on price (1 point per 100 currency units)
    const pointsEarned = Math.floor(Number(plan.price) / 100);
    if (pointsEarned > 0) {
      await this.addLoyaltyPoints({
        tenantId: data.tenantId,
        customerId: data.customerId,
        points: pointsEarned,
        type: 'EARNED',
        source: 'MEMBERSHIP',
        reference: membership.id,
      });
    }

    // Send WhatsApp notification
    try {
      const planName = membership.membershipPlan.nameAr || membership.membershipPlan.name;
      const endDateStr = endDate.toLocaleDateString('ar-EG');
      await this.whatsappService.sendMembershipPurchased(
        data.tenantId,
        customer.phone,
        planName,
        endDateStr
      );
    } catch (error) {
      Logger.error('Failed to send WhatsApp notification:', error);
    }

    return membership;
  }

  async cancelMembership(membershipId: string, tenantId: string) {
    const membership = await prisma.customerMembership.findFirst({
      where: {
        id: membershipId,
        tenantId,
      },
      include: {
        customer: true,
        membershipPlan: true,
      },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'ACTIVE') {
      throw new Error('Can only cancel active memberships');
    }

    const updatedMembership = await prisma.customerMembership.update({
      where: { id: membershipId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    return updatedMembership;
  }

  async getActiveMembership(customerId: string, tenantId: string) {
    return await prisma.customerMembership.findFirst({
      where: {
        customerId,
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        membershipPlan: true,
      },
    });
  }

  async getCustomerMemberships(customerId: string, tenantId: string) {
    return await prisma.customerMembership.findMany({
      where: {
        customerId,
        tenantId,
      },
      include: {
        membershipPlan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAllPlans(tenantId: string) {
    return await prisma.membershipPlan.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        price: 'asc',
      },
    });
  }

  async createPlan(data: {
    tenantId: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    price: number;
    durationDays: number;
    includedServices: string[];
    includedVisits?: number;
    discountPercentage?: number;
  }) {
    return await prisma.membershipPlan.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        descriptionAr: data.descriptionAr,
        descriptionEn: data.descriptionEn,
        price: data.price,
        durationDays: data.durationDays,
        includedServices: data.includedServices as any,
        includedVisits: data.includedVisits,
        discountPercentage: data.discountPercentage,
      },
    });
  }

  async updatePlan(
    planId: string,
    tenantId: string,
    data: {
      name?: string;
      nameAr?: string;
      nameEn?: string;
      description?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      price?: number;
      durationDays?: number;
      includedServices?: string[];
      includedVisits?: number;
      discountPercentage?: number;
      isActive?: boolean;
    }
  ) {
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        tenantId,
      },
    });

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    return await prisma.membershipPlan.update({
      where: { id: planId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
        ...(data.includedServices !== undefined && { includedServices: data.includedServices as any }),
        ...(data.includedVisits !== undefined && { includedVisits: data.includedVisits }),
        ...(data.discountPercentage !== undefined && { discountPercentage: data.discountPercentage }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deletePlan(planId: string, tenantId: string) {
    const plan = await prisma.membershipPlan.findFirst({
      where: {
        id: planId,
        tenantId,
      },
    });

    if (!plan) {
      throw new Error('Membership plan not found');
    }

    // Check if any active memberships use this plan
    const activeMemberships = await prisma.customerMembership.count({
      where: {
        membershipPlanId: planId,
        status: 'ACTIVE',
      },
    });

    if (activeMemberships > 0) {
      throw new Error('Cannot delete plan with active memberships');
    }

    await prisma.membershipPlan.delete({
      where: { id: planId },
    });
  }

  async expireMemberships() {
    // Find all active memberships that have expired
    const expiredMemberships = await prisma.customerMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: new Date(),
        },
      },
      include: {
        customer: true,
        membershipPlan: true,
      },
    });

    // Update their status to EXPIRED
    for (const membership of expiredMemberships) {
      await prisma.customerMembership.update({
        where: { id: membership.id },
        data: {
          status: 'EXPIRED',
          updatedAt: new Date(),
        },
      });

      // Send WhatsApp notification
      try {
        const planName = membership.membershipPlan.nameAr || membership.membershipPlan.name;
        await this.whatsappService.sendMembershipExpired(
          membership.tenantId,
          membership.customer.phone,
          planName
        );
      } catch (error) {
        Logger.error('Failed to send WhatsApp notification:', error);
      }
    }

    return expiredMemberships.length;
  }

  async checkExpiringMemberships() {
    // Find memberships expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringMemberships = await prisma.customerMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: sevenDaysFromNow,
          gte: new Date(),
        },
      },
      include: {
        customer: true,
        membershipPlan: true,
      },
    });

    // Send notifications
    for (const membership of expiringMemberships) {
      try {
        const planName = membership.membershipPlan.nameAr || membership.membershipPlan.name;
        const endDateStr = membership.endDate.toLocaleDateString('ar-EG');
        await this.whatsappService.sendMembershipExpiring(
          membership.tenantId,
          membership.customer.phone,
          planName,
          endDateStr
        );
      } catch (error) {
        Logger.error('Failed to send WhatsApp notification:', error);
      }
    }

    return expiringMemberships.length;
  }

  private async addLoyaltyPoints(data: {
    tenantId: string;
    customerId: string;
    points: number;
    type: 'EARNED' | 'REDEEMED';
    source: 'INVOICE' | 'MEMBERSHIP' | 'MANUAL';
    reference?: string;
  }) {
    // Create transaction
    await prisma.loyaltyPointTransaction.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        points: data.points,
        type: data.type,
        source: data.source,
        reference: data.reference,
      },
    });

    // Update customer loyalty points
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (customer) {
      const newPoints = data.type === 'EARNED'
        ? customer.loyaltyPoints + data.points
        : Math.max(0, customer.loyaltyPoints - data.points);

      await prisma.customer.update({
        where: { id: data.customerId },
        data: { loyaltyPoints: newPoints },
      });
    }
  }
}
