import prisma from '../../config/database';
import {
  CreateAssetCategoryInput,
  UpdateAssetCategoryInput,
  CreateAssetInput,
  UpdateAssetInput,
  AssetCategoryResponse,
  AssetResponse,
} from './types';

export class AssetService {
  // ─── Asset Categories ───
  async getAllCategories(tenantId: string): Promise<AssetCategoryResponse[]> {
    const cats = await prisma.assetCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return cats.map(this.mapCategory);
  }

  async createCategory(tenantId: string, input: CreateAssetCategoryInput): Promise<AssetCategoryResponse> {
    const cat = await prisma.assetCategory.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description || null,
        depreciationMethod: input.depreciationMethod || 'STRAIGHT_LINE',
        usefulLifeYears: input.usefulLifeYears || 5,
      },
    });
    return this.mapCategory(cat);
  }

  async updateCategory(tenantId: string, id: string, input: UpdateAssetCategoryInput): Promise<AssetCategoryResponse | null> {
    await prisma.assetCategory.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.depreciationMethod && { depreciationMethod: input.depreciationMethod }),
        ...(input.usefulLifeYears !== undefined && { usefulLifeYears: input.usefulLifeYears }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    const cat = await prisma.assetCategory.findFirst({ where: { id, tenantId } });
    return cat ? this.mapCategory(cat) : null;
  }

  async deleteCategory(tenantId: string, id: string): Promise<boolean> {
    const result = await prisma.assetCategory.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return result.count > 0;
  }

  // ─── Assets ───
  async getAllAssets(tenantId: string): Promise<AssetResponse[]> {
    const assets = await prisma.asset.findMany({
      where: { tenantId, isActive: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return assets.map((a: any) => this.mapAsset(a, a.category?.name));
  }

  async createAsset(tenantId: string, input: CreateAssetInput): Promise<AssetResponse> {
    const category = await prisma.assetCategory.findFirst({
      where: { id: input.categoryId, tenantId },
    });

    const monthlyDep = this.calculateMonthlyDepreciation(
      input.purchaseCost,
      input.salvageValue || 0,
      category?.usefulLifeYears || 5,
      category?.depreciationMethod || 'STRAIGHT_LINE'
    );

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        categoryId: input.categoryId,
        name: input.name,
        description: input.description || null,
        purchaseCost: input.purchaseCost,
        purchaseDate: new Date(input.purchaseDate),
        salvageValue: input.salvageValue || 0,
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

    let monthlyDep: any = existing.monthlyDepreciation;
    if (input.purchaseCost !== undefined || input.salvageValue !== undefined) {
      const category = await prisma.assetCategory.findFirst({
        where: { id: input.categoryId || existing.categoryId, tenantId },
      });
      monthlyDep = this.calculateMonthlyDepreciation(
        input.purchaseCost ?? Number(existing.purchaseCost),
        input.salvageValue ?? Number(existing.salvageValue),
        category?.usefulLifeYears || 5,
        category?.depreciationMethod || 'STRAIGHT_LINE'
      );
    }

    await prisma.asset.updateMany({
      where: { id, tenantId },
      data: {
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.purchaseCost !== undefined && { purchaseCost: input.purchaseCost }),
        ...(input.purchaseDate && { purchaseDate: new Date(input.purchaseDate) }),
        ...(input.salvageValue !== undefined && { salvageValue: input.salvageValue }),
        ...(monthlyDep !== undefined && { monthlyDepreciation: monthlyDep }),
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

  // ─── Mappers ───
  private mapCategory(cat: any): AssetCategoryResponse {
    return {
      id: cat.id,
      tenantId: cat.tenantId,
      name: cat.name,
      description: cat.description,
      depreciationMethod: cat.depreciationMethod,
      usefulLifeYears: cat.usefulLifeYears,
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
      monthlyDepreciation: asset.monthlyDepreciation ? Number(asset.monthlyDepreciation) : null,
      userAdjustedDepreciation: asset.userAdjustedDepreciation ? Number(asset.userAdjustedDepreciation) : null,
      accumulatedDepreciation: asset.accumulatedDepreciation ? Number(asset.accumulatedDepreciation) : null,
      isActive: asset.isActive,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }
}

export const assetService = new AssetService();
