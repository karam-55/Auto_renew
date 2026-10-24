export interface CreateBookingJobCostInput {
  bookingId: string;
  mechanicId?: string;
  serviceId: string;
  costCenterId?: string;
  laborHours?: number;
  laborCost?: number;
  laborCostUSD?: number;
  materialCost?: number;
  materialCostUSD?: number;
  overheadCost?: number;
  overheadCostUSD?: number;
  totalCost?: number;
  totalCostUSD?: number;
  exchangeRateUsed?: number;
  varianceNote?: string;
}

export interface UpdateBookingJobCostInput {
  mechanicId?: string;
  serviceId?: string;
  costCenterId?: string;
  laborHours?: number;
  laborCost?: number;
  laborCostUSD?: number;
  materialCost?: number;
  materialCostUSD?: number;
  overheadCost?: number;
  overheadCostUSD?: number;
  totalCost?: number;
  totalCostUSD?: number;
  exchangeRateUsed?: number;
  varianceNote?: string;
}

export interface BookingJobCostResponse {
  id: string;
  tenantId: string;
  bookingId: string;
  mechanicId: string | null;
  serviceId: string;
  costCenterId: string | null;
  laborHours: number | null;
  laborCost: number | null;
  laborCostUSD: number | null;
  materialCost: number | null;
  materialCostUSD: number | null;
  overheadCost: number | null;
  overheadCostUSD: number | null;
  totalCost: number | null;
  totalCostUSD: number | null;
  exchangeRateUsed: number | null;
  varianceNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}
