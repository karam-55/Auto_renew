/**
 * A service line in a booking create/update payload.
 * - `serviceId`: required, references an active Service.
 * - `priceSYP` / `priceUSD`: optional custom price for this booking line.
 *   When omitted, the service's default `priceSYP`/`priceUSD` is used.
 */
export interface BookingServiceInput {
  serviceId: string;
  priceSYP?: number;
  priceUSD?: number;
}

export interface CreateBookingInput {
  customerId: string;
  vehicleId: string;
  scheduledDate: Date;
  scheduledTime?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  /** Legacy: list of service IDs (uses each service's default price). */
  serviceIds?: string[];
  /** Preferred: list of services with optional custom prices per booking line. */
  services?: BookingServiceInput[];
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
  /** Legacy: list of service IDs (uses each service's default price). */
  serviceIds?: string[];
  /** Preferred: list of services with optional custom prices per booking line. */
  services?: BookingServiceInput[];
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
  /** Total price for all booking services (sum of per-line prices). */
  totalSYP?: number;
  totalUSD?: number | null;
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
    /** Actual price charged on this booking line (may differ from basePrice). */
    priceSYP?: number;
    priceUSD?: number | null;
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
