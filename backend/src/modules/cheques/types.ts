import { ChequeStatus, ChequeType } from '@prisma/client';

export interface Cheque {
  id: string;
  tenantId: string;
  chequeNumber: string;
  type: ChequeType;
  bankName: string;
  branchName: string | null;
  bankBranch: string | null;
  accountNumber: string | null;
  amountSYP: number;
  amountUSD: number | null;
  currency: string;
  chequeDate: Date;
  dueDate: Date;
  customerId: string | null;
  supplierId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  status: ChequeStatus;
  issuerName: string | null;
  receiverName: string | null;
  notes: string | null;
  bouncedAt: Date | null;
  bouncedReason: string | null;
  clearedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChequeDto {
  chequeNumber?: string;
  chequeType: ChequeType;
  bankName: string;
  bankBranch?: string;
  accountNumber?: string;
  amountSYP?: number;
  amountUSD?: number;
  amount?: number; // For backward compatibility
  currency?: string;
  dueDate: Date;
  issueDate: Date;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  paymentId?: string;
  notes?: string;
}

export interface UpdateChequeDto {
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  notes?: string;
}

export interface ChequeFilters {
  chequeType?: ChequeType;
  status?: ChequeStatus;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  bankName?: string;
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface ChequeTransaction {
  id: string;
  tenantId: string;
  chequeId: string;
  transactionType: string; // 'ISSUED', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED'
  transactionDate: Date;
  amountSYP: number;
  amountUSD: number | null;
  bankFeeSYP: number;
  bankFeeUSD: number | null;
  notes: string | null;
  reference: string | null;
  createdAt: Date;
  cheque?: Cheque;
}

export interface CreateChequeTransactionDto {
  chequeId: string;
  transactionType: string;
  transactionDate: Date;
  amountSYP?: number;
  amountUSD?: number;
  notes?: string;
}

export interface ChequeSummary {
  id: string;
  chequeNumber: string;
  type: ChequeType;
  bankName: string;
  amountSYP: number;
  amountUSD: number | null;
  currency: string;
  dueDate: Date;
  status: ChequeStatus;
  daysUntilDue: number;
}