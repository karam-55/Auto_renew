import prisma from '../../config/database';
import { MembershipStatus } from '@prisma/client';
import { MembershipService } from '../membership/membership.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { WalletService } from '../wallet/wallet.service';

export interface MembershipBenefit {
  serviceIncluded: boolean;
  discountPercentage?: number;
  remainingVisits?: number;
}

export interface BenefitsResult {
  membershipBenefit?: MembershipBenefit;
  walletBalance: number;
  loyaltyPoints: number;
  appliedDiscount: number;
  appliedWallet: number;
  appliedPoints: number;
}

export class BenefitsEngine {
  private membershipService: MembershipService;
  private loyaltyService: LoyaltyService;
  private walletService: WalletService;

  constructor() {
    this.membershipService = new MembershipService();
    this.loyaltyService = new LoyaltyService();
    this.walletService = new WalletService();
  }

  async getCustomerBenefits(customerId: string, tenantId: string): Promise<BenefitsResult> {
    // Get active membership
    const activeMembership = await this.membershipService.getActiveMembership(customerId, tenantId);
    
    let membershipBenefit: MembershipBenefit | undefined;
    if (activeMembership) {
      const includedServices = activeMembership.membershipPlan.includedServices as string[];
      membershipBenefit = {
        serviceIncluded: includedServices.length > 0,
        discountPercentage: activeMembership.membershipPlan.discountPercentage 
          ? Number(activeMembership.membershipPlan.discountPercentage) 
          : undefined,
        remainingVisits: activeMembership.remainingVisits ?? undefined,
      };
    }

    // Get wallet balance
    const walletBalance = await this.walletService.getBalance(customerId, tenantId);

    // Get loyalty points
    const loyaltyPoints = await this.loyaltyService.getCustomerPoints(customerId, tenantId);

    return {
      membershipBenefit,
      walletBalance,
      loyaltyPoints,
      appliedDiscount: 0,
      appliedWallet: 0,
      appliedPoints: 0,
    };
  }

  async applyMembershipBenefits(
    customerId: string,
    tenantId: string,
    serviceId: string,
    originalPrice: number
  ): Promise<{ finalPrice: number; benefitApplied: boolean; reason?: string }> {
    const activeMembership = await this.membershipService.getActiveMembership(customerId, tenantId);

    if (!activeMembership) {
      return { finalPrice: originalPrice, benefitApplied: false };
    }

    const plan = activeMembership.membershipPlan;
    const includedServices = plan.includedServices as string[];

    // Check if service is included in membership
    if (includedServices.includes(serviceId)) {
      // Check if there are remaining visits
      if (activeMembership.remainingVisits !== null && activeMembership.remainingVisits > 0) {
        // Deduct one visit
        await prisma.customerMembership.update({
          where: { id: activeMembership.id },
          data: {
            remainingVisits: activeMembership.remainingVisits - 1,
            updatedAt: new Date(),
          },
        });
        return { 
          finalPrice: 0, 
          benefitApplied: true, 
          reason: 'Service included in membership' 
        };
      } else if (activeMembership.remainingVisits === 0) {
        // No visits left, apply discount if available
        if (plan.discountPercentage) {
          const discount = originalPrice * (Number(plan.discountPercentage) / 100);
          return { 
            finalPrice: originalPrice - discount, 
            benefitApplied: true, 
            reason: `Membership discount: ${plan.discountPercentage}%` 
          };
        }
      }
    }

    // Apply discount percentage if available
    if (plan.discountPercentage) {
      const discount = originalPrice * (Number(plan.discountPercentage) / 100);
      return { 
        finalPrice: originalPrice - discount, 
        benefitApplied: true, 
        reason: `Membership discount: ${plan.discountPercentage}%` 
      };
    }

    return { finalPrice: originalPrice, benefitApplied: false };
  }

  async applyWalletPayment(
    customerId: string,
    tenantId: string,
    amount: number
  ): Promise<{ appliedAmount: number; remainingBalance: number }> {
    const walletBalance = await this.walletService.getBalance(customerId, tenantId);

    if (walletBalance === 0) {
      return { appliedAmount: 0, remainingBalance: amount };
    }

    const appliedAmount = Math.min(walletBalance, amount);
    await this.walletService.deductBalance({
      tenantId,
      customerId,
      amount: appliedAmount,
    });

    return { 
      appliedAmount, 
      remainingBalance: amount - appliedAmount 
    };
  }

  async applyPointsRedemption(
    customerId: string,
    tenantId: string,
    pointsToRedeem: number
  ): Promise<{ redeemedPoints: number; discountAmount: number }> {
    const availablePoints = await this.loyaltyService.getCustomerPoints(customerId, tenantId);

    if (availablePoints < pointsToRedeem) {
      throw new Error('Insufficient loyalty points');
    }

    // Redeem points
    await this.loyaltyService.redeemPoints({
      tenantId,
      customerId,
      points: pointsToRedeem,
    });

    // Calculate discount (1 point = 100 ل.س)
    const discountAmount = await this.loyaltyService.calculateDiscountFromPoints(pointsToRedeem);

    return { 
      redeemedPoints: pointsToRedeem, 
      discountAmount 
    };
  }

  async calculateInvoiceTotal(
    customerId: string,
    tenantId: string,
    items: Array<{ serviceId: string; price: number }>,
    applyMembership: boolean = true,
    applyWallet: boolean = false,
    applyPoints: number = 0
  ): Promise<BenefitsResult> {
    let subtotal = 0;
    let appliedDiscount = 0;
    let appliedWallet = 0;
    let appliedPoints = 0;

    // Calculate base subtotal
    for (const item of items) {
      subtotal += item.price;
    }

    // Apply membership benefits
    if (applyMembership) {
      for (const item of items) {
        const result = await this.applyMembershipBenefits(
          customerId,
          tenantId,
          item.serviceId,
          item.price
        );
        if (result.benefitApplied) {
          const discount = item.price - result.finalPrice;
          appliedDiscount += discount;
          subtotal = subtotal - item.price + result.finalPrice;
        }
      }
    }

    // Apply points redemption
    if (applyPoints > 0) {
      const pointsResult = await this.applyPointsRedemption(customerId, tenantId, applyPoints);
      appliedPoints = pointsResult.redeemedPoints;
      appliedDiscount += pointsResult.discountAmount;
      subtotal -= pointsResult.discountAmount;
    }

    // Apply wallet payment
    if (applyWallet) {
      const walletResult = await this.applyWalletPayment(customerId, tenantId, subtotal);
      appliedWallet = walletResult.appliedAmount;
      subtotal = walletResult.remainingBalance;
    }

    // Get current benefits state
    const benefits = await this.getCustomerBenefits(customerId, tenantId);

    return {
      ...benefits,
      appliedDiscount,
      appliedWallet,
      appliedPoints,
    };
  }

  async earnPointsFromInvoice(customerId: string, tenantId: string, total: number) {
    const points = await this.loyaltyService.calculatePointsFromInvoice(total);
    if (points > 0) {
      await this.loyaltyService.addPoints({
        tenantId,
        customerId,
        points,
        source: 'INVOICE',
      });
    }
    return points;
  }
}
