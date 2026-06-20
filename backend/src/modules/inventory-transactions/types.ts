import { TransactionType as PrismaTransactionType } from '@prisma/client';

export type TransactionType = PrismaTransactionType;

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  partId: string;
  warehouseId: string | null;
  transactionType: TransactionType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryTransactionDto {
  partId: string;
  warehouseId?: string;
  supplierId?: string;
  transactionType: TransactionType;
  quantity: number;
  unitCost: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface UpdateInventoryTransactionDto {
  partId?: string;
  warehouseId?: string;
  supplierId?: string;
  transactionType?: TransactionType;
  quantity?: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

export interface InventoryTransactionFilters {
  partId?: string;
  warehouseId?: string;
  transactionType?: TransactionType;
  referenceType?: string;
  referenceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConsumePartDto {
  partId: string;
  quantity: number;
  bookingId: string;
  warehouseId?: string;
  notes?: string;
}
