// ============================================
// INVENTORY COUNTING TYPES
// ============================================

export interface InventoryCount {
  id: string;
  tenantId: string;
  countNumber: string;
  countType: string;
  warehouseId?: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  countedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: {
    id: string;
    name: string;
    location?: string;
  };
  counter?: {
    id: string;
    fullName: string;
  };
  approver?: {
    id: string;
    fullName: string;
  };
  items?: InventoryCountItem[];
}

export interface CreateInventoryCountInput {
  warehouseId?: string;
  countType: string;
  scheduledDate: Date;
  notes?: string;
}

export interface UpdateInventoryCountInput {
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actualDate?: Date;
  notes?: string;
}

export interface InventoryCountItem {
  id: string;
  countId: string;
  partId: string;
  partName: string;
  partCode?: string;
  expectedQty: number;
  actualQty: number;
  varianceQty: number;
  unitCostSYP: number;
  unitCostUSD?: number;
  varianceSYP: number;
  varianceUSD?: number;
  notes?: string;
  count?: InventoryCount;
  part?: {
    id: string;
    name: string;
    code?: string;
  };
}

export interface CreateInventoryCountItemInput {
  partId: string;
  expectedQty: number;
  actualQty: number;
  notes?: string;
}

export interface UpdateInventoryCountItemInput {
  actualQty: number;
  notes?: string;
}

export interface InventoryCountFilters {
  warehouseId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  countNumber?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
