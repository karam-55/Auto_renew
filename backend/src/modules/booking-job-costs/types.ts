export interface CreateBookingJobCostInput {
  bookingId: string;
  mechanicId?: string;
  serviceId: string;
  costCenterId?: string;
  laborHours?: number;
  laborCost?: number;
  materialCost?: number;
  overheadCost?: number;
  totalCost?: number;
  varianceNote?: string;
}

export interface UpdateBookingJobCostInput {
  mechanicId?: string;
  serviceId?: string;
  costCenterId?: string;
  laborHours?: number;
  laborCost?: number;
  materialCost?: number;
  overheadCost?: number;
  totalCost?: number;
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
  materialCost: number | null;
  overheadCost: number | null;
  totalCost: number | null;
  varianceNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}
