import prisma from '../../src/config/database';
import { ServiceCategoryService } from '../../src/modules/services/service-category.service';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    account: { findFirst: jest.fn() },
    accountPostingMap: { findFirst: jest.fn() },
    service: { findFirst: jest.fn(), create: jest.fn() },
    serviceCategory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('ServiceCategoryService deletion safety', () => {
  const service = new ServiceCategoryService();

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((callback: any) => callback({
      account: { findFirst: jest.fn().mockResolvedValue(null) },
      accountPostingMap: { findFirst: jest.fn().mockResolvedValue(null) },
      costCenter: { findFirst: jest.fn().mockResolvedValue(null) },
      service: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: data.code, ...data })),
      },
      serviceCategory: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.nameAr, ...data })),
      },
    }));
  });

  it('hides soft-deleted categories from tenant reads', async () => {
    (prisma.serviceCategory.findMany as jest.Mock).mockResolvedValue([]);

    await service.getAllCategories('tenant-a');

    expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a', deletedAt: null },
    }));
  });

  it('initializes the three default departments without duplicating existing ones', async () => {
    const existingDepartment = {
      id: 'department-existing',
      nameAr: 'الصيانة الميكانيكية والفنية',
      isActive: true,
      deletedAt: null,
    };
    const tx = {
      account: { findFirst: jest.fn().mockResolvedValue(null) },
      accountPostingMap: { findFirst: jest.fn().mockResolvedValue(null) },
      costCenter: { findFirst: jest.fn().mockResolvedValue(null) },
      service: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: data.code, ...data })),
      },
      serviceCategory: {
        findFirst: jest.fn()
          .mockResolvedValueOnce(existingDepartment)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.nameAr, ...data })),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback: any) => callback(tx));

    const categories = await service.initializeDefaultDepartments('tenant-a');

    expect(categories).toHaveLength(3);
    expect(tx.serviceCategory.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-a',
        nameAr: 'الصيانة الميكانيكية والفنية',
        deletedAt: null,
      },
    });
    expect(tx.serviceCategory.create).toHaveBeenCalledTimes(2);
    expect(tx.service.create).toHaveBeenCalledTimes(23);
    expect(tx.service.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        code: 'MECH-005',
        nameAr: 'تبديل زيت',
        pricingUnit: 'لتر',
      }),
    }));
  });

  it('soft-deletes an empty category instead of physically removing it', async () => {
    (prisma.serviceCategory.findFirst as jest.Mock).mockResolvedValue({
      id: 'category-a',
      _count: { services: 0 },
    });
    (prisma.serviceCategory.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    await service.deleteCategory('category-a', 'tenant-a');

    expect(prisma.serviceCategory.updateMany).toHaveBeenCalledWith({
      where: { id: 'category-a', tenantId: 'tenant-a', deletedAt: null },
      data: { isActive: false, deletedAt: expect.any(Date) },
    });
  });

  it('refuses to delete a category that still has services', async () => {
    (prisma.serviceCategory.findFirst as jest.Mock).mockResolvedValue({
      id: 'category-a',
      _count: { services: 1 },
    });

    await expect(service.deleteCategory('category-a', 'tenant-a'))
      .rejects.toThrow('Cannot delete category with services');

    expect(prisma.serviceCategory.updateMany).not.toHaveBeenCalled();
  });
});
