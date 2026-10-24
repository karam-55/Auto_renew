import prisma from '../../config/database';
import {
  CreateAssetCategoryInput,
  UpdateAssetCategoryInput,
  CreateAssetInput,
  UpdateAssetInput,
  AssetCategoryResponse,
  AssetResponse,
} from './types';

const DEPRECIATION_METHODS = new Set(['STRAIGHT_LINE', 'DECLINING_BALANCE']);

export class AssetService {
  // ─── Asset Categories ───
  async getAllCategories(tenantId: string, includeInactive = false): Promise<AssetCategoryResponse[]> {
    const cats = await prisma.assetCategory.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { createdAt: 'desc' },
    });
    return cats.map(this.mapCategory);
  }

  async createCategory(tenantId: string, input: CreateAssetCategoryInput): Promise<AssetCategoryResponse> {
    const name = String(input.name || '').trim();
    const depreciationMethod = input.depreciationMethod || 'STRAIGHT_LINE';
    const usefulLifeYears = Number(input.usefulLifeYears ?? 5);
    const salvageValuePercent = Number(input.salvageValuePercent ?? 10);
    if (!name) throw new Error('Category name is required');
    this.validateDepreciationSettings(depreciationMethod, usefulLifeYears, salvageValuePercent);
    const cat = await prisma.assetCategory.create({
      data: {
        tenantId,
        name,
        description: input.description || null,
        depreciationMethod,
        usefulLifeYears,
        salvageValuePercent,
      },
    });
    return this.mapCategory(cat);
  }

  async updateCategory(tenantId: string, id: string, input: UpdateAssetCategoryInput): Promise<AssetCategoryResponse | null> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.assetCategory.findFirst({ where: { id, tenantId } });
      if (!existing) return null;

      const name = input.name !== undefined ? String(input.name).trim() : existing.name;
      const depreciationMethod = input.depreciationMethod ?? existing.depreciationMethod;
      const usefulLifeYears = Number(input.usefulLifeYears ?? existing.usefulLifeYears);
      const salvageValuePercent = Number(input.salvageValuePercent ?? existing.salvageValuePercent);
      if (!name) throw new Error('Category name is required');
      this.validateDepreciationSettings(depreciationMethod, usefulLifeYears, salvageValuePercent);

      const category = await tx.assetCategory.update({
        where: { id },
        data: {
          name,
          ...(input.description !== undefined && { description: input.description }),
          depreciationMethod,
          usefulLifeYears,
          salvageValuePercent,
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      const calculationChanged =
        depreciationMethod !== existing.depreciationMethod ||
        usefulLifeYears !== existing.usefulLifeYears;
      if (calculationChanged) {
        const assets = await tx.asset.findMany({
          where: { tenantId, categoryId: id, isActive: true, userAdjustedDepreciation: null },
          select: { id: true, purchaseCost: true, salvageValue: true },
        });
        for (const asset of assets) {
          const monthlyDepreciation = this.calculateMonthlyDepreciation(
            Number(asset.purchaseCost),
            Number(asset.salvageValue),
            usefulLifeYears,
            depreciationMethod,
          );
          await tx.asset.update({
            where: { id: asset.id },
            data: { monthlyDepreciation },
          });
        }
      }
      return this.mapCategory(category);
    });
  }

  async deleteCategory(tenantId: string, id: string): Promise<boolean> {
    const activeAssets = await prisma.asset.count({
      where: { tenantId, categoryId: id, isActive: true },
    });
    if (activeAssets > 0) {
      throw new Error('Deactivate or move the category assets before deleting this category');
    }
    const result = await prisma.assetCategory.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  // ─── Assets ───
  async getAllAssets(tenantId: string, includeInactive = false): Promise<AssetResponse[]> {
    const assets = await prisma.asset.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return assets.map((a: any) => this.mapAsset(a, a.category?.name));
  }

  async createAsset(tenantId: string, input: CreateAssetInput): Promise<AssetResponse> {
    const name = String(input.name || '').trim();
    const purchaseCost = Number(input.purchaseCost);
    const purchaseDate = new Date(input.purchaseDate);
    if (!name) throw new Error('Asset name is required');
    if (!Number.isFinite(purchaseCost) || purchaseCost <= 0) throw new Error('Purchase cost must be greater than zero');
    if (Number.isNaN(purchaseDate.getTime())) throw new Error('A valid purchase date is required');
    const category = await prisma.assetCategory.findFirst({
      where: { id: input.categoryId, tenantId, isActive: true },
    });
    if (!category) throw new Error('Choose an active asset category in this company');

    const salvageValue = input.salvageValue == null
      ? Math.round(purchaseCost * Number(category.salvageValuePercent) / 100 * 100) / 100
      : Number(input.salvageValue);
    if (!Number.isFinite(salvageValue) || salvageValue < 0 || salvageValue > purchaseCost) {
      throw new Error('Salvage value must be between zero and the purchase cost');
    }
    this.validateUserDepreciation(input.userAdjustedDepreciation);
    const monthlyDep = this.calculateMonthlyDepreciation(
      purchaseCost,
      salvageValue,
      category.usefulLifeYears,
      category.depreciationMethod,
    );

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        categoryId: input.categoryId,
        name,
        description: input.description || null,
        purchaseCost,
        purchaseDate,
        salvageValue,
        monthlyDepreciation: monthlyDep as any,
        userAdjustedDepreciation: input.userAdjustedDepreciation ?? null,
        accumulatedDepreciation: 0,
      },
    });
    return this.mapAsset(asset, category?.name);
  }

  async updateAsset(tenantId: string, id: string, input: UpdateAssetInput): Promise<AssetResponse | null> {
    const existing = await prisma.asset.findFirst({ where: { id, tenantId } });
    if (!existing) return null;

    const categoryId = input.categoryId ?? existing.categoryId;
    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, tenantId, isActive: true },
    });
    if (!category) throw new Error('Choose an active asset category in this company');

    const name = input.name !== undefined ? String(input.name).trim() : existing.name;
    const purchaseCost = Number(input.purchaseCost ?? existing.purchaseCost);
    const salvageValue = Number(input.salvageValue ?? existing.salvageValue);
    const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : undefined;
    if (!name) throw new Error('Asset name is required');
    if (!Number.isFinite(purchaseCost) || purchaseCost <= 0) throw new Error('Purchase cost must be greater than zero');
    if (!Number.isFinite(salvageValue) || salvageValue < 0 || salvageValue > purchaseCost) {
      throw new Error('Salvage value must be between zero and the purchase cost');
    }
    if (purchaseDate && Number.isNaN(purchaseDate.getTime())) throw new Error('A valid purchase date is required');
    this.validateUserDepreciation(input.userAdjustedDepreciation);
    const monthlyDep = this.calculateMonthlyDepreciation(
      purchaseCost,
      salvageValue,
      category.usefulLifeYears,
      category.depreciationMethod,
    );

    await prisma.asset.updateMany({
      where: { id, tenantId },
      data: {
        categoryId,
        name,
        ...(input.description !== undefined && { description: input.description }),
        purchaseCost,
        ...(purchaseDate && { purchaseDate }),
        salvageValue,
        monthlyDepreciation: monthlyDep,
        ...(input.userAdjustedDepreciation !== undefined && { userAdjustedDepreciation: input.userAdjustedDepreciation }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    const updated = await prisma.asset.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    return updated ? this.mapAsset(updated, (updated as any).category?.name) : null;
  }

  async deleteAsset(tenantId: string, id: string): Promise<boolean> {
    const result = await prisma.asset.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  // ─── Depreciation Calculation ───
  private calculateMonthlyDepreciation(
    purchaseCost: number,
    salvageValue: number,
    usefulLifeYears: number,
    method: string
  ): number {
    if (method === 'DECLINING_BALANCE') {
      const rate = 2 / usefulLifeYears;
      return Number(((purchaseCost - salvageValue) * rate / 12).toFixed(2));
    }
    // STRAIGHT_LINE (default)
    const totalDepreciation = purchaseCost - salvageValue;
    const monthlyDep = totalDepreciation / (usefulLifeYears * 12);
    return Number(monthlyDep.toFixed(2));
  }

  private validateDepreciationSettings(method: string, usefulLifeYears: number, salvageValuePercent: number): void {
    if (!DEPRECIATION_METHODS.has(method)) {
      throw new Error('Choose straight-line or declining-balance depreciation');
    }
    if (!Number.isInteger(usefulLifeYears) || usefulLifeYears < 1 || usefulLifeYears > 100) {
      throw new Error('Useful life must be between 1 and 100 years');
    }
    if (!Number.isFinite(salvageValuePercent) || salvageValuePercent < 0 || salvageValuePercent > 100) {
      throw new Error('Salvage value percentage must be between 0 and 100');
    }
  }

  private validateUserDepreciation(value?: number | null): void {
    if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      throw new Error('Manual monthly depreciation cannot be negative');
    }
  }

  // ─── Mappers ───
  private mapCategory(cat: any): AssetCategoryResponse {
    return {
      id: cat.id,
      tenantId: cat.tenantId,
      name: cat.name,
      description: cat.description,
      depreciationMethod: cat.depreciationMethod,
      usefulLifeYears: cat.usefulLifeYears,
      salvageValuePercent: Number(cat.salvageValuePercent ?? 10),
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }

  private mapAsset(asset: any, categoryName?: string): AssetResponse {
    return {
      id: asset.id,
      tenantId: asset.tenantId,
      categoryId: asset.categoryId,
      categoryName,
      name: asset.name,
      description: asset.description,
      purchaseCost: Number(asset.purchaseCost),
      purchaseDate: asset.purchaseDate,
      salvageValue: Number(asset.salvageValue),
      monthlyDepreciation: asset.monthlyDepreciation == null ? null : Number(asset.monthlyDepreciation),
      userAdjustedDepreciation: asset.userAdjustedDepreciation == null ? null : Number(asset.userAdjustedDepreciation),
      accumulatedDepreciation: asset.accumulatedDepreciation == null ? null : Number(asset.accumulatedDepreciation),
      isActive: asset.isActive,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}

export const assetService = new AssetService();
