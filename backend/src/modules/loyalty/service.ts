import { RewardType } from '@prisma/client';
import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AddPointsInput,
  CreateRewardInput,
  UpdateRewardInput,
  LoyaltyFilters,
  PaginationParams,
  PaginatedResponse,
  CustomerLoyaltySummary,
  LoyaltyPoint,
  LoyaltyReward
} from './types';


// Loyalty tier thresholds
const LOYALTY_TIERS = {
  BRONZE: { minPoints: 0, multiplier: 1.0 },
  SILVER: { minPoints: 1000, multiplier: 1.2 },
  GOLD: { minPoints: 5000, multiplier: 1.5 },
  PLATINUM: { minPoints: 10000, multiplier: 2.0 }
};

export class LoyaltyService {
  private io: any;

  setIo(io: any) {
    this.io = io;
  }

  // ============================================
  // LOYALTY POINTS MANAGEMENT
  // ============================================

  async addPoints(tenantId: string, data: AddPointsInput): Promise<LoyaltyPoint> {
    // Verify customer exists and belongs to tenant
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create loyalty point record
    const loyaltyPoint = await prisma.loyaltyPoint.create({
      data: {
        tenantId,
        customerId: data.customerId,
        points: data.points,
        reason: data.reason || '',
        invoiceId: data.invoiceId,
      },
    });

    // Update customer's total points
    const updatedCustomer = await prisma.customer.update({
      where: { id: data.customerId },
      data: {
        loyaltyPoints: {
          increment: data.points,
        },
      },
    });

    // Emit notification if socket.io is available
    if (this.io) {
      this.io.to(`tenant:${tenantId}`).emit('loyalty:points-added', {
        customerId: data.customerId,
        points: data.points,
        newTotal: updatedCustomer.loyaltyPoints,
        reason: data.reason,
      });
    }

    return {
      ...loyaltyPoint,
      invoiceId: loyaltyPoint.invoiceId || undefined,
      reason: loyaltyPoint.reason || undefined,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        loyaltyPoints: updatedCustomer.loyaltyPoints,
      },
    };
  }

  async getLoyaltyPoints(
    tenantId: string,
    filters: LoyaltyFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<LoyaltyPoint>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { customerId, invoiceId, dateFrom, dateTo } = filters;

    const where: any = { tenantId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const [data, total] = await Promise.all([
      prisma.loyaltyPoint.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyPoint.count({ where }),
    ]);

    // Fetch customer data separately
    const pointsWithCustomers = await Promise.all(
      data.map(async (point) => {
        const customer = await prisma.customer.findUnique({
          where: { id: point.customerId },
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        });
        return {
          ...point,
          invoiceId: point.invoiceId || undefined,
          reason: point.reason || undefined,
          customer,
        };
      })
    );

    return {
      data: pointsWithCustomers as LoyaltyPoint[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // LOYALTY REWARDS MANAGEMENT
  // ============================================

  async createReward(tenantId: string, data: CreateRewardInput): Promise<LoyaltyReward> {
    const reward = await prisma.loyaltyReward.create({
      data: {
        tenantId,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        pointsRequired: data.pointsRequired,
        discountType: data.discountType,
        discountValue: data.discountValue,
        isActive: data.isActive ?? true,
      },
    });

    return {
      ...reward,
      discountValue: Number(reward.discountValue),
      nameAr: reward.nameAr || undefined,
      nameEn: reward.nameEn || undefined,
      description: reward.description || undefined,
    };
  }

  async getRewards(
    tenantId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<LoyaltyReward>> {
    const { page = 1, limit = 10, sortBy = 'pointsRequired', sortOrder = 'asc' } = pagination;

    const [data, total] = await Promise.all([
      prisma.loyaltyReward.findMany({
        where: { tenantId },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyReward.count({ where: { tenantId } }),
    ]);

    return {
      data: data.map(reward => ({
        ...reward,
        discountValue: Number(reward.discountValue),
        nameAr: reward.nameAr || undefined,
        nameEn: reward.nameEn || undefined,
        description: reward.description || undefined,
      })) as LoyaltyReward[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRewardById(tenantId: string, rewardId: string): Promise<LoyaltyReward> {
    const reward = await prisma.loyaltyReward.findFirst({
      where: { id: rewardId, tenantId },
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    return {
      ...reward,
      discountValue: Number(reward.discountValue),
      nameAr: reward.nameAr || undefined,
      nameEn: reward.nameEn || undefined,
      description: reward.description || undefined,
    };
  }

  async updateReward(tenantId: string, rewardId: string, data: UpdateRewardInput): Promise<LoyaltyReward> {
    // Verify reward exists and belongs to tenant
    const existingReward = await prisma.loyaltyReward.findFirst({
      where: { id: rewardId, tenantId },
    });

    if (!existingReward) {
      throw new Error('Reward not found');
    }

    const reward = await prisma.loyaltyReward.update({
      where: { id: rewardId },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        pointsRequired: data.pointsRequired,
        discountType: data.discountType,
        discountValue: data.discountValue,
        isActive: data.isActive,
      },
    });

    return {
      ...reward,
      discountValue: Number(reward.discountValue),
      nameAr: reward.nameAr || undefined,
      nameEn: reward.nameEn || undefined,
      description: reward.description || undefined,
    };
  }

  async deleteReward(tenantId: string, rewardId: string): Promise<void> {
    // Verify reward exists and belongs to tenant
    const reward = await prisma.loyaltyReward.findFirst({
      where: { id: rewardId, tenantId },
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    await prisma.loyaltyReward.delete({
      where: { id: rewardId },
    });
  }

  // ============================================
  // CUSTOMER LOYALTY SUMMARY
  // ============================================

  async getCustomerLoyaltySummary(tenantId: string, customerId: string): Promise<CustomerLoyaltySummary> {
    // Get customer with current points
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        loyaltyPoints: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Determine current tier (simplified)
    let currentTier = 'BRONZE';
    let nextTier = 'SILVER';
    let pointsToNextTier = LOYALTY_TIERS.SILVER.minPoints - customer.loyaltyPoints;

    if (customer.loyaltyPoints >= LOYALTY_TIERS.PLATINUM.minPoints) {
      currentTier = 'PLATINUM';
      nextTier = 'PLATINUM';
      pointsToNextTier = 0;
    } else if (customer.loyaltyPoints >= LOYALTY_TIERS.GOLD.minPoints) {
      currentTier = 'GOLD';
      nextTier = 'PLATINUM';
      pointsToNextTier = LOYALTY_TIERS.PLATINUM.minPoints - customer.loyaltyPoints;
    } else if (customer.loyaltyPoints >= LOYALTY_TIERS.SILVER.minPoints) {
      currentTier = 'SILVER';
      nextTier = 'GOLD';
      pointsToNextTier = LOYALTY_TIERS.GOLD.minPoints - customer.loyaltyPoints;
    }

    // Get available rewards (customer can afford)
    const availableRewards = await prisma.loyaltyReward.findMany({
      where: {
        tenantId,
        isActive: true,
        pointsRequired: {
          lte: customer.loyaltyPoints,
        },
      },
      orderBy: { pointsRequired: 'asc' },
    });

    // Get recent points (last 10)
    const recentPoints = await prisma.loyaltyPoint.findMany({
      where: {
        tenantId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch customer data for points
    const pointsWithCustomers = await Promise.all(
      recentPoints.map(async (point) => {
        const customer = await prisma.customer.findUnique({
          where: { id: point.customerId },
          select: {
            id: true,
            fullName: true,
            phone: true,
            loyaltyPoints: true,
          },
        });
        return {
          ...point,
          invoiceId: point.invoiceId || undefined,
          reason: point.reason || undefined,
          customer,
        };
      })
    );

    return {
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      loyaltyPoints: customer.loyaltyPoints,
      loyaltyTier: currentTier,
      pointsToNextTier,
      nextTier,
      availableRewards: availableRewards.map(reward => ({
        ...reward,
        discountValue: Number(reward.discountValue),
        nameAr: reward.nameAr || undefined,
        nameEn: reward.nameEn || undefined,
        description: reward.description || undefined,
      })) as LoyaltyReward[],
      recentPoints: pointsWithCustomers as LoyaltyPoint[],
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async calculatePointsFromInvoice(invoiceTotalSYP: number): Promise<number> {
    // Base calculation: 1 point per 1000 SYP
    const basePoints = Math.floor(invoiceTotalSYP / 1000);
    
    // Apply BRONZE multiplier (default)
    const multiplier = LOYALTY_TIERS.BRONZE.multiplier;
    
    return Math.floor(basePoints * multiplier);
  }
}