import { GRNStatus as PrismaGRNStatus } from '@prisma/client';

export type GRNStatus = PrismaGRNStatus;

export interface GoodsReceiptNote {
  id: string;
  tenantId: string;
  grnNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  warehouseId?: string;
  receivedDate: Date;
  status: GRNStatus;
  receivedBy: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  supplier?: {
    id: string;
    name: string;
    phone: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    status: string;
  };
  lines?: GRNLine[];
}

export interface GRNLine {
  id: string;
  grnId: string;
  partId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unitCost: number;
  totalCost: number;
  createdAt: Date;
  part?: {
    id: string;
    partNumber: string;
    name: string;
  };
}

export interface CreateGRNDto {
  purchaseOrderId: string;
  supplierId: string;
  warehouseId?: string;
  receivedDate?: Date;
  notes?: string;
  lines?: CreateGRNLineDto[];
}

export interface UpdateGRNDto {
  supplierId?: string;
  warehouseId?: string;
  receivedDate?: Date;
  status?: GRNStatus;
  notes?: string;
}

export interface CreateGRNLineDto {
  partId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity?: number;
  unitCost: number;
}

export interface UpdateGRNLineDto {
  orderedQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number;
  unitCost?: number;
}

export interface GRNFilters {
  supplierId?: string;
  warehouseId?: string;
  purchaseOrderId?: string;
  status?: GRNStatus;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
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
