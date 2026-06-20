export enum PartStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface Part {
  id: string;
  tenantId: string;
  partNumber: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  categoryId?: string;
  supplierId?: string;
  costSYP: number;
  costUSD?: number;
  sellingPriceSYP: number;
  sellingPriceUSD?: number;
  quantity: number;
  minQuantity: number;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePartDto {
  partNumber: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  categoryId?: string;
  supplierId?: string;
  costSYP: number;
  costUSD?: number;
  sellingPriceSYP: number;
  sellingPriceUSD?: number;
  quantity?: number;
  minQuantity?: number;
  location?: string;
  isActive?: boolean;
}

export interface UpdatePartDto {
  partNumber?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  categoryId?: string;
  supplierId?: string;
  costSYP?: number;
  costUSD?: number;
  sellingPriceSYP?: number;
  sellingPriceUSD?: number;
  quantity?: number;
  minQuantity?: number;
  location?: string;
  isActive?: boolean;
}

export interface PartFilters {
  categoryId?: string;
  supplierId?: string;
  status?: PartStatus;
  minQuantity?: number;
  maxQuantity?: number;
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
