import { InstallmentStatus, InstallmentPaymentStatus, PaymentFrequency } from '@prisma/client';

export interface Installment {
  id: string;
  installmentPlanId: string;
  sequenceNumber: number;
  dueDate: Date;
  amountSYP: number;
  amountUSD: number | null;
  paidSYP: number;
  paidUSD: number;
  status: InstallmentPaymentStatus;
  paidAt: Date | null;
  reminderSentAt: Date | null;
  installmentPlan?: InstallmentPlan;
}

export interface InstallmentPlan {
  id: string;
  tenantId: string;
  customerId: string;
  supplierId: string | null;
  invoiceId: string | null;
  planNumber: string;
  totalAmountSYP: number;
  totalAmountUSD: number | null;
  downPaymentSYP: number;
  downPaymentUSD: number | null;
  downPaymentPaidSYP: number;
  downPaymentPaidUSD: number | null;
  remainingAmountSYP: number;
  remainingAmountUSD: number | null;
  numberOfPayments: number;
  interestRate: number;
  interestAmountSYP: number;
  interestAmountUSD: number | null;
  paymentFrequency: PaymentFrequency;
  currency: string;
  startDate: Date;
  endDate: Date | null;
  status: InstallmentStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  installments?: Installment[];
}

export interface CreateInstallmentDto {
  dueDate: Date;
  amountSYP: number;
  amountUSD?: number;
}

export interface CreateInstallmentPlanDto {
  customerId: string;
  supplierId?: string;
  invoiceId?: string;
  totalAmountSYP: number;
  totalAmountUSD?: number;
  downPaymentSYP?: number;
  downPaymentUSD?: number;
  numberOfPayments: number;
  interestRate?: number;
  paymentFrequency: PaymentFrequency;
  currency?: string;
  startDate: Date;
  notes?: string;
}

export interface UpdateInstallmentPlanDto {
  notes?: string;
}

export interface InstallmentPlanFilters {
  status?: InstallmentStatus;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface InstallmentSummary {
  id: string;
  planNumber: string;
  customerId: string;
  supplierId: string | null;
  invoiceId: string | null;
  totalAmountSYP: number;
  downPaymentSYP: number;
  downPaymentPaidSYP: number;
  remainingAmountSYP: number;
  numberOfPayments: number;
  paidInstallments: number;
  paymentFrequency: PaymentFrequency;
  currency: string;
  status: InstallmentStatus;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
}