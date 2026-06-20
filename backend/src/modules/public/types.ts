// Public API Types for Customer Tracking
// NO AUTHENTICATION REQUIRED - Public endpoints

export interface PublicVehicleResponse {
  make: string;
  model: string;
  year: number;
  licensePlate: string | null;
  vin: string | null;
  currentKm: number | null;
  lastServiceDate: Date | null;
  nextServiceDate: Date | null;
}

export interface PublicCustomerResponse {
  fullName: string;
  phone: string;
  address: string | null;
}

export interface PublicServiceResponse {
  id: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  description: string | null;
  priceSYP: number;
  priceUSD: number | null;
  estimatedDurationMinutes: number | null;
}

export interface PublicInvoiceResponse {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  subtotalSYP: number;
  subtotalUSD: number | null;
  taxSYP: number;
  taxUSD: number | null;
  discountSYP: number;
  discountUSD: number | null;
  totalSYP: number;
  totalUSD: number | null;
  paidSYP: number;
  paidUSD: number | null;
  balanceSYP: number;
  balanceUSD: number | null;
  status: string;
  notes: string | null;
}

export interface PublicTenantResponse {
  id: string;
  companyName: string;
  companyNameAr: string | null;
  companyNameEn: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
}

export interface PublicTechnicianResponse {
  id: string;
  fullNameAr: string;
  fullNameEn: string | null;
  position: string;
}

export interface PublicScheduleResponse {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  technician: PublicTechnicianResponse | null;
  service: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
}

export interface PublicHistoryResponse {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
}

export interface PublicFaultResponse {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface PublicRecommendationResponse {
  id: string;
  title: string;
  description: string;
  dueMileage: number | null;
  dueDate: Date | null;
  status: string;
  createdAt: Date;
}

export interface PublicAttachmentResponse {
  id: string;
  fileUrl: string;
  type: string;
  description: string | null;
  createdAt: Date;
}

export interface PublicBookingResponse {
  id: string;
  status: string;
  publicToken: string;
  notes: string | null;
  estimatedCompletionDate: Date | null;
  actualCompletionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: PublicCustomerResponse;
  vehicle: PublicVehicleResponse;
  services: PublicServiceResponse[];
  invoice: PublicInvoiceResponse | null;
  tenant: PublicTenantResponse;
  schedules: PublicScheduleResponse[];
  histories: PublicHistoryResponse[];
  faults: PublicFaultResponse[];
  recommendations: PublicRecommendationResponse[];
  attachments: PublicAttachmentResponse[];
}

export interface PublicTokenValidationResponse {
  valid: boolean;
  bookingId: string | null;
  error?: string;
}
