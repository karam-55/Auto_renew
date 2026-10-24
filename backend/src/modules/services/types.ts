export interface ServicePartInput {
  partId: string;
  quantity: number;
}

export interface CreateServiceInput {
  code?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  pricingUnit?: string;
  vehicleType?: string;
  specification?: string;
  serviceType?: string;
  category?: string;
  revenueAccountId?: string | null;
  costAccountId?: string | null;
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
  departmentId?: string;
  assignedEmployeeId?: string;
  parts?: ServicePartInput[];
}

export interface UpdateServiceInput {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  pricingUnit?: string;
  vehicleType?: string;
  specification?: string;
  serviceType?: string;
  category?: string;
  revenueAccountId?: string | null;
  costAccountId?: string | null;
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
  departmentId?: string;
  assignedEmployeeId?: string;
  parts?: ServicePartInput[];
}

export interface ServicePartResponse {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitCostSYP: number;
  unitCostUSD: number | null;
  totalCostSYP: number;
  totalCostUSD: number | null;
}

export interface ServiceResponse {
  id: string;
  tenantId: string;
  name: string;
  code: string | null;
  nameAr: string | null;
  nameEn: string | null;
  description: string | null;
  pricingUnit: string | null;
  vehicleType: string | null;
  specification: string | null;
  serviceType: string;
  category: string | null;
  revenueAccountId: string | null;
  costAccountId: string | null;
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
  departmentId: string | null;
  assignedEmployeeId: string | null;
  parts: ServicePartResponse[];
  createdAt: Date;
  updatedAt: Date;
}
