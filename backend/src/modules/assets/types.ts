export interface CreateAssetCategoryInput {
  name: string;
  description?: string;
  depreciationMethod?: string;
  usefulLifeYears?: number;
}

export interface UpdateAssetCategoryInput {
  name?: string;
  description?: string;
  depreciationMethod?: string;
  usefulLifeYears?: number;
  isActive?: boolean;
}

export interface CreateAssetInput {
  categoryId: string;
  name: string;
  description?: string;
  purchaseCost: number;
  purchaseDate: string;
  salvageValue?: number;
  userAdjustedDepreciation?: number;
}

export interface UpdateAssetInput {
  categoryId?: string;
  name?: string;
  description?: string;
  purchaseCost?: number;
  purchaseDate?: string;
  salvageValue?: number;
  monthlyDepreciation?: number;
  userAdjustedDepreciation?: number;
  isActive?: boolean;
}

export interface AssetCategoryResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  depreciationMethod: string;
  usefulLifeYears: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetResponse {
  id: string;
  tenantId: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  purchaseCost: number;
  purchaseDate: Date;
  salvageValue: number;
  monthlyDepreciation: number | null;
  userAdjustedDepreciation: number | null;
  accumulatedDepreciation: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
