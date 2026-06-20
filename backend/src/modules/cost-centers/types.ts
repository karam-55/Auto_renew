export interface CreateCostCenterInput {
  name: string;
  nameAr?: string;
  type: string;
  costDriver: string;
  driverQuantity?: number;
  monthlyBudget?: number;
  actualCost?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateCostCenterInput {
  name?: string;
  nameAr?: string;
  type?: string;
  costDriver?: string;
  driverQuantity?: number;
  monthlyBudget?: number;
  actualCost?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CreateCostCenterAllocationInput {
  fromCenterId: string;
  toCenterId: string;
  allocationPercent: number;
}

export interface UpdateCostCenterAllocationInput {
  fromCenterId?: string;
  toCenterId?: string;
  allocationPercent?: number;
  isActive?: boolean;
}

export interface CostCenterResponse {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  type: string;
  costDriver: string;
  driverQuantity: number;
  monthlyBudget: number;
  actualCost: number | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCenterAllocationResponse {
  id: string;
  tenantId: string;
  fromCenterId: string;
  toCenterId: string;
  fromCenterName?: string;
  toCenterName?: string;
  allocationPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OverheadRateResponse {
  costCenterId: string;
  costCenterName: string;
  costDriver: string;
  driverQuantity: number;
  monthlyBudget: number;
  allocatedFromShared: number;
  totalBudget: number;
  rate: number;
  rateUnit: string;
}

export interface ServiceCostBreakdownInput {
  serviceId: string;
  laborCostSYP: number;
  laborCostUSD?: number;
  materialCostSYP: number;
  materialCostUSD?: number;
  estimatedDurationMinutes: number;
  estimatedMaterialMoves?: number;
}

export interface ServiceCostBreakdownResponse {
  serviceId: string;
  directLaborSYP: number;
  directMaterialSYP: number;
  variableOverheadSYP: number;
  fixedOverheadSYP: number;
  depreciationSYP: number;
  totalCostSYP: number;
  profitAmountSYP: number;
  finalPriceSYP: number;
  finalPriceUSD: number;
  costDetails: CostDetailItem[];
}

export interface CostDetailItem {
  costCenterId?: string;
  assetId?: string;
  costCenterName: string;
  costType: string;
  amountSYP: number;
  amountUSD?: number;
  isCalculated: boolean;
}
