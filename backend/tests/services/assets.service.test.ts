import { AssetService } from '../../src/modules/assets/service';
import prisma from '../../src/config/database';

jest.mock('../../src/config/database', () => {
  const client: any = {
    assetCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    asset: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };
  client.$transaction = jest.fn((callback: any) => callback(client));
  return { __esModule: true, default: client };
});

describe('AssetService', () => {
  let service: AssetService;
  const tenantId = 'tenant-assets';
  const category = {
    id: 'category-1',
    tenantId,
    name: 'أجهزة',
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 5,
    salvageValuePercent: 10,
    isActive: true,
  };

  beforeEach(() => {
    service = new AssetService();
    jest.clearAllMocks();
  });

  it('creates a category with validated depreciation settings', async () => {
    (prisma.assetCategory.create as jest.Mock).mockImplementation(async ({ data }) => ({
      id: 'category-1',
      ...data,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.createCategory(tenantId, {
      name: 'أجهزة',
      usefulLifeYears: 4,
      salvageValuePercent: 15,
      depreciationMethod: 'DECLINING_BALANCE',
    });

    expect(result).toMatchObject({
      name: 'أجهزة',
      usefulLifeYears: 4,
      salvageValuePercent: 15,
      depreciationMethod: 'DECLINING_BALANCE',
    });
  });

  it('rejects unsupported methods and invalid category settings', async () => {
    await expect(service.createCategory(tenantId, {
      name: 'طريقة غير مدعومة',
      depreciationMethod: 'UNITS_OF_PRODUCTION',
    })).rejects.toThrow('Choose straight-line or declining-balance depreciation');
    await expect(service.createCategory(tenantId, {
      name: 'عمر غير صالح',
      usefulLifeYears: 0,
    })).rejects.toThrow('Useful life must be between 1 and 100 years');
  });

  it('uses the category salvage percentage to initialize an asset', async () => {
    (prisma.assetCategory.findFirst as jest.Mock).mockResolvedValue(category);
    (prisma.asset.create as jest.Mock).mockImplementation(async ({ data }) => ({
      id: 'asset-1',
      ...data,
      accumulatedDepreciation: 0,
      isActive: true,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.createAsset(tenantId, {
      categoryId: category.id,
      name: 'رافعة',
      purchaseCost: 10000,
      purchaseDate: '2026-01-10',
    });

    expect(prisma.asset.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        salvageValue: 1000,
        monthlyDepreciation: 150,
        accumulatedDepreciation: 0,
      }),
    }));
    expect(result.monthlyDepreciation).toBe(150);
  });

  it('recalculates monthly depreciation after category policy changes but keeps manual overrides', async () => {
    (prisma.assetCategory.findFirst as jest.Mock).mockResolvedValue(category);
    (prisma.assetCategory.update as jest.Mock).mockImplementation(async ({ data }) => ({
      ...category,
      ...data,
    }));
    (prisma.asset.findMany as jest.Mock).mockResolvedValue([
      { id: 'asset-auto', purchaseCost: 10000, salvageValue: 1000 },
    ]);
    (prisma.asset.update as jest.Mock).mockResolvedValue({});

    await service.updateCategory(tenantId, category.id, {
      usefulLifeYears: 10,
    });

    expect(prisma.asset.update).toHaveBeenCalledWith({
      where: { id: 'asset-auto' },
      data: { monthlyDepreciation: 75 },
    });
    expect(prisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userAdjustedDepreciation: null }),
    }));
  });

  it('does not delete a category while active assets still reference it', async () => {
    (prisma.asset.count as jest.Mock).mockResolvedValue(1);

    await expect(service.deleteCategory(tenantId, category.id))
      .rejects.toThrow('Deactivate or move the category assets before deleting this category');
    expect(prisma.assetCategory.updateMany).not.toHaveBeenCalled();
  });
});
