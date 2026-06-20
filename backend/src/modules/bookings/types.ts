export interface CreateBookingInput {
  customerId: string;
  vehicleId: string;
  scheduledDate: Date;
  scheduledTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  serviceIds?: string[];
  technicianId?: string;
  paymentMethod?: 'CASH' | 'CREDIT' | 'ELECTRONIC';
}

export interface UpdateBookingInput {
  customerId?: string;
  vehicleId?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  serviceIds?: string[];
  paymentMethod?: 'CASH' | 'CREDIT' | 'ELECTRONIC';
}

export interface BookingResponse {
  id: string;
  tenantId: string;
  customerId: string;
  vehicleId: string;
  scheduledDate: Date;
  scheduledTime?: string | null;
  status: string;
  priority?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  publicToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
  };
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  services?: Array<{
    id: string;
    name: string;
    category: string;
    duration: number;
    basePrice: number;
  }>;
  mechanicAssignments?: Array<{
    id: string;
    mechanicUserId: string;
    mechanic?: {
      id: string;
      fullName: string;
      phone: string;
    };
  }>;
}
