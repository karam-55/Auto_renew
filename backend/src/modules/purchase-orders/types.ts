import { OrderStatus as PrismaOrderStatus } from '@prisma/client';

export type PurchaseOrderStatus = PrismaOrderStatus;

// Alias to match Prisma schema
export { PurchaseOrderStatus as OrderStatus };

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  orderNumber: string;
  supplierId: string;
  warehouseId?: string;
  orderDate: Date;
  expectedDate?: Date;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  supplier?: {
    id: string;
    name: string;
    phone: string;
  };
  items?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  partId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
  part?: {
    id: string;
    partNumber: string;
    name: string;
  };
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  warehouseId?: string;
  orderDate?: Date;
  expectedDate?: Date;
  notes?: string;
  items?: CreatePurchaseOrderLineDto[];
}

export interface UpdatePurchaseOrderDto {
  supplierId?: string;
  warehouseId?: string;
  orderDate?: Date;
  expectedDate?: Date;
  status?: PurchaseOrderStatus;
  notes?: string;
}

export interface CreatePurchaseOrderLineDto {
  partId: string;
  quantity: number;
  unitCost: number;
}

export interface UpdatePurchaseOrderLineDto {
  quantity?: number;
  unitCost?: number;
  receivedQuantity?: number;
}

export interface PurchaseOrderFilters {
  supplierId?: string;
  warehouseId?: string;
  status?: PurchaseOrderStatus;
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
