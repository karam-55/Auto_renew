export interface PartCategory {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  inventoryAccountId?: string | null;
  costAccountId?: string | null;
  revenueAccountId?: string | null;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePartCategoryDto {
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  inventoryAccountId?: string | null;
  costAccountId?: string | null;
  revenueAccountId?: string | null;
  icon?: string;
  color?: string;
}

export interface UpdatePartCategoryDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  inventoryAccountId?: string | null;
  costAccountId?: string | null;
  revenueAccountId?: string | null;
  icon?: string;
  color?: string;
}

export interface CategoryTreeNode extends PartCategory {
  children: CategoryTreeNode[];
}
