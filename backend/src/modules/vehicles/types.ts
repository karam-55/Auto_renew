export interface CreateVehicleInput {
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  currentKm?: number;
  notes?: string;
  categoryId?: string;
}

export interface UpdateVehicleInput {
  customerId?: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  color?: string;
  currentKm?: number;
  notes?: string;
  categoryId?: string;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
}

export interface VehicleResponse {
  id: string;
  tenantId: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  publicCarId: string;
  currentKm: number | null;
  color: string | null;
  notes: string | null;
  categoryId: string | null;
  lastServiceDate: Date | null;
  nextServiceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    address?: string;
    city?: string;
    isVip: boolean;
    loyaltyPoints: number;
  };
  category?: {
    id: string;
    nameAr: string;
    nameEn: string | null;
  };
  activeBooking?: {
    id: string;
    status: string;
    scheduledDate?: Date;
    scheduledTime?: string;
    notes?: string;
  };
}
