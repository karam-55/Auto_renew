import { RewardType } from '@prisma/client';

// ============================================
// LOYALTY POINTS
// ============================================

export interface LoyaltyPoint {
  id: string;
  tenantId: string;
  customerId: string;
  points: number;
  invoiceId?: string | null;
  reason?: string | null;
  createdAt: Date;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    loyaltyPoints: number;
  };
}

export interface AddPointsInput {
  customerId: string;
  points: number;
  reason?: string;
  invoiceId?: string;
}

// ============================================
// LOYALTY REWARDS
// ============================================

export interface LoyaltyReward {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  pointsRequired: number;
  discountType: RewardType;
  discountValue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRewardInput {
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  pointsRequired: number;
  discountType: RewardType;
  discountValue: number;
  isActive?: boolean;
}

export interface UpdateRewardInput {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  pointsRequired?: number;
  discountType?: RewardType;
  discountValue?: number;
  isActive?: boolean;
}

// ============================================
// CUSTOMER LOYALTY SUMMARY
// ============================================

export interface CustomerLoyaltySummary {
  customerId: string;
  customerName: string;
  customerPhone: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  pointsToNextTier: number;
  nextTier: string;
  availableRewards: LoyaltyReward[];
  recentPoints: LoyaltyPoint[];
}

// ============================================
// FILTERS & PAGINATION
// ============================================

export interface LoyaltyFilters {
  customerId?: string;
  rewardId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  invoiceId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
