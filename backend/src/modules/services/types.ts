export interface CreateServiceInput {
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  category?: string;
  duration?: number;
  basePrice?: number;
  laborCostSYP?: number;
  laborCostUSD?: number;
  materialCostSYP?: number;
  materialCostUSD?: number;
  profitType?: 'percentage' | 'fixed';
  profitMargin?: number;
  profitAmountSYP?: number;
  profitAmountUSD?: number;
  hasWarranty?: boolean;
  warrantyDescription?: string;
  warrantyTerms?: string;
  loyaltyPoints?: number;
  priceSYP?: number;
  priceUSD?: number;
  estimatedDurationMinutes?: number;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  category?: string;
  duration?: number;
  basePrice?: number;
  laborCostSYP?: number;
  laborCostUSD?: number;
  materialCostSYP?: number;
  materialCostUSD?: number;
  profitType?: 'percentage' | 'fixed';
  profitMargin?: number;
  profitAmountSYP?: number;
  profitAmountUSD?: number;
  hasWarranty?: boolean;
  warrantyDescription?: string;
  warrantyTerms?: string;
  loyaltyPoints?: number;
  priceSYP?: number;
  priceUSD?: number;
  estimatedDurationMinutes?: number;
  isActive?: boolean;
}

export interface ServiceResponse {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  description: string | null;
  category: string | null;
  duration: number | null;
  basePrice: number | null;
  laborCostSYP: number | null;
  laborCostUSD: number | null;
  materialCostSYP: number | null;
  materialCostUSD: number | null;
  profitType: string | null;
  profitMargin: number | null;
  profitAmountSYP: number | null;
  profitAmountUSD: number | null;
  hasWarranty: boolean;
  warrantyDescription: string | null;
  warrantyTerms: string | null;
  loyaltyPoints: number;
  priceSYP: number;
  priceUSD: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
