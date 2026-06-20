import { InvoiceStatus } from '@prisma/client';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  partId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  priceSYP: number;
  priceUSD: number | null;
  totalSYP: number;
  totalUSD: number | null;
}

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string | null;
  bookingId: string | null;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date | null;
  subtotalSYP: number;
  subtotalUSD: number | null;
  taxSYP: number;
  taxUSD: number | null;
  taxRateId: string | null;
  discountType: string;
  discountPercent: number | null;
  discountSYP: number;
  discountUSD: number | null;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  totalSYP: number;
  totalUSD: number | null;
  paidSYP: number;
  paidUSD: number | null;
  status: InvoiceStatus;
  notes: string | null;
  installmentPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: InvoiceItem[];
  customer?: any;
  booking?: any;
  vehicle?: any;
  taxRate?: any;
  installmentPlan?: any;
}

export interface CreateInvoiceItemDto {
  partId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  priceSYP: number;
  priceUSD?: number;
}

export interface CreateInvoiceDto {
  customerId?: string;
  vehicleId?: string;
  bookingId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  taxRateId?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountPercent?: number;
  discountSYP?: number;
  discountUSD?: number;
  notes?: string;
  installmentPlanId?: string;
  items: CreateInvoiceItemDto[];
}

export interface UpdateInvoiceDto {
  invoiceDate?: Date;
  dueDate?: Date;
  notes?: string;
  taxRateId?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountPercent?: number;
  discountSYP?: number;
  discountUSD?: number;
  items?: CreateInvoiceItemDto[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customerId?: string;
  bookingId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerName?: string;
  subtotalSYP: number;
  totalSYP: number;
  paidSYP: number;
  status: InvoiceStatus;
}