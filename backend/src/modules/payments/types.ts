import { PaymentMethod } from '@prisma/client';

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amountSYP: number;
  amountUSD: number | null;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  reference: string | null;
  notes: string | null;
  cashRegisterSessionId: string | null;
  createdAt: Date;
  invoice?: any;
  cashRegisterSession?: any;
}

export interface CreatePaymentDto {
  invoiceId: string;
  amountSYP: number;
  amountUSD?: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  cashRegisterSessionId?: string;
}

export interface UpdatePaymentDto {
  paymentDate?: Date;
  amountSYP?: number;
  amountUSD?: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentFilters {
  paymentMethod?: PaymentMethod;
  invoiceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentSummary {
  id: string;
  paymentDate: Date;
  amountSYP: number;
  amountUSD: number | null;
  paymentMethod: PaymentMethod;
  invoiceNumber?: string;
}