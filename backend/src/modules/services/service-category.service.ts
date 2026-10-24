import { AccountType, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { DEFAULT_ACCOUNT_CODES } from '../accounting/chart-of-accounts.defaults';

const DEFAULT_SERVICE_DEPARTMENTS = [
  {
    name: 'الصيانة الميكانيكية والفنية',
    nameAr: 'الصيانة الميكانيكية والفنية',
    nameEn: 'Mechanical and Technical Maintenance',
    revenueRole: 'SERVICE_REVENUE',
    costRole: 'COST_MAINTENANCE',
    costCenterCode: 'D01',
  },
  {
    name: 'الغسيل والخدمات السريعة',
    nameAr: 'الغسيل والخدمات السريعة',
    nameEn: 'Washing and Quick Services',
    revenueRole: 'WASH_REVENUE',
    costRole: 'COST_WASHING',
    costCenterCode: 'D03',
  },
  {
    name: 'الحماية والعناية والتجديد',
    nameAr: 'الحماية والعناية والتجديد',
    nameEn: 'Protection, Care and Renewal',
    revenueRole: 'PROTECTION_REVENUE',
    costRole: 'COST_PROTECTION',
    costCenterCode: 'D02',
  },
] as const;

const DEFAULT_DEPARTMENT_SERVICES = [
  { code: 'MECH-001', category: 'الصيانة الميكانيكية والفنية', name: 'فحص سيارة شامل', nameEn: 'Complete Vehicle Inspection', type: 'FIXED', unit: 'سيارة', revenueRole: 'INSPECTION_REVENUE' },
  { code: 'MECH-002', category: 'الصيانة الميكانيكية والفنية', name: 'فحص كومبيوتر فقط', nameEn: 'Computer Diagnostics', type: 'FIXED', unit: 'عملية', revenueRole: 'INSPECTION_REVENUE' },
  { code: 'MECH-003', category: 'الصيانة الميكانيكية والفنية', name: 'صيانة شاملة وتعديل السيارة', nameEn: 'Comprehensive Maintenance and Modification', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'MECH-004', category: 'الصيانة الميكانيكية والفنية', name: 'بخ حراري', nameEn: 'Thermal Coating', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'MECH-005', category: 'الصيانة الميكانيكية والفنية', name: 'تبديل زيت', nameEn: 'Oil Change', type: 'OIL_PAID', unit: 'لتر' },
  { code: 'MECH-006', category: 'الصيانة الميكانيكية والفنية', name: 'تعبئة غاز مكيف', nameEn: 'Air Conditioning Gas Refill', type: 'VARIABLE', unit: 'عملية' },
  { code: 'MECH-007', category: 'الصيانة الميكانيكية والفنية', name: 'قطع واكسسوارات', nameEn: 'Parts and Accessories', type: 'STANDARD', unit: 'قطعة', revenueRole: 'PARTS_REVENUE' },
  { code: 'MECH-008', category: 'الصيانة الميكانيكية والفنية', name: 'تبديل كوليات', nameEn: 'Brake Pad Replacement', type: 'STANDARD', unit: 'عملية' },
  { code: 'MECH-009', category: 'الصيانة الميكانيكية والفنية', name: 'برمجة سيارة', nameEn: 'Vehicle Programming', type: 'FIXED', unit: 'عملية', revenueRole: 'INSPECTION_REVENUE' },
  { code: 'MECH-010', category: 'الصيانة الميكانيكية والفنية', name: 'تعريب سيارة', nameEn: 'Vehicle Arabic Localization', type: 'FIXED', unit: 'عملية', revenueRole: 'INSPECTION_REVENUE' },
  { code: 'MECH-011', category: 'الصيانة الميكانيكية والفنية', name: 'تنظيف محرك بالثلج الجاف', nameEn: 'Dry Ice Engine Cleaning', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'WASH-001', category: 'الغسيل والخدمات السريعة', name: 'غسيل سيارة داخلي خارجي', nameEn: 'Interior and Exterior Wash', type: 'STANDARD', unit: 'سيارة' },
  { code: 'WASH-002', category: 'الغسيل والخدمات السريعة', name: 'غسيل خارجي', nameEn: 'Exterior Wash', type: 'STANDARD', unit: 'سيارة' },
  { code: 'WASH-003', category: 'الغسيل والخدمات السريعة', name: 'غسيل داخلي', nameEn: 'Interior Wash', type: 'STANDARD', unit: 'سيارة' },
  { code: 'WASH-004', category: 'الغسيل والخدمات السريعة', name: 'شفط بارد', nameEn: 'Cold Vacuum', type: 'STANDARD', unit: 'سيارة' },
  { code: 'WASH-005', category: 'الغسيل والخدمات السريعة', name: 'دوزان', nameEn: 'Wheel Balancing', type: 'STANDARD', unit: 'عملية' },
  { code: 'WASH-006', category: 'الغسيل والخدمات السريعة', name: 'اطارات', nameEn: 'Tires', type: 'STANDARD', unit: 'إطار' },
  { code: 'CARE-001', category: 'الحماية والعناية والتجديد', name: 'حماية PPF', nameEn: 'PPF Protection', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'CARE-002', category: 'الحماية والعناية والتجديد', name: 'تغليف فينيل', nameEn: 'Vinyl Wrap', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'CARE-003', category: 'الحماية والعناية والتجديد', name: 'نانو سيراميك', nameEn: 'Nano Ceramic Coating', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'CARE-004', category: 'الحماية والعناية والتجديد', name: 'تلميع', nameEn: 'Polishing', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'CARE-005', category: 'الحماية والعناية والتجديد', name: 'بوليش داخلي وخارجي', nameEn: 'Interior and Exterior Polish', type: 'JOB_BASED', unit: 'سيارة' },
  { code: 'CARE-006', category: 'الحماية والعناية والتجديد', name: 'تجديد', nameEn: 'Renewal and Reconditioning', type: 'JOB_BASED', unit: 'سيارة' },
] as const;

export class ServiceCategoryService {
  async initializeDefaultDepartments(tenantId: string) {
    return prisma.$transaction(async (tx) => {
      const categories = [];
      for (const department of DEFAULT_SERVICE_DEPARTMENTS) {
        const revenueAccountId = await this.findDefaultRevenueAccountId(tx, tenantId, department.revenueRole);
        const costAccountId = await this.findDefaultCostAccountId(tx, tenantId, department.costRole);
        const costCenterId = await this.findDefaultCostCenterId(tx, tenantId, department.costCenterCode);
        const existing = await tx.serviceCategory.findFirst({
          where: {
            tenantId,
            nameAr: department.nameAr,
            deletedAt: null,
          },
        });

        if (existing) {
          if (
            (!existing.revenueAccountId && revenueAccountId) ||
            (!existing.costAccountId && costAccountId) ||
            (!existing.costCenterId && costCenterId)
          ) {
            categories.push(await tx.serviceCategory.update({
              where: { id: existing.id },
              data: {
                ...(!existing.revenueAccountId && revenueAccountId ? { revenueAccountId } : {}),
                ...(!existing.costAccountId && costAccountId ? { costAccountId } : {}),
                ...(!existing.costCenterId && costCenterId ? { costCenterId } : {}),
              },
            }));
          } else {
            categories.push(existing);
          }
          continue;
        }

        const {
          revenueRole: _revenueRole,
          costRole: _costRole,
          costCenterCode: _costCenterCode,
          ...categoryData
        } = department;
        categories.push(await tx.serviceCategory.create({
          data: { ...categoryData, tenantId, revenueAccountId, costAccountId, costCenterId },
        }));
      }

      for (const service of DEFAULT_DEPARTMENT_SERVICES) {
        const category = categories.find((item: any) => item.nameAr === service.category);
        if (!category) throw new Error(`Default service category ${service.category} was not created`);
        const revenueRole = 'revenueRole' in service ? service.revenueRole : undefined;
        const revenueAccountId = revenueRole
          ? await this.findDefaultRevenueAccountId(tx, tenantId, revenueRole)
          : null;
        const existing = await tx.service.findFirst({
          where: { tenantId, code: service.code, deletedAt: null },
          select: { id: true, revenueAccountId: true, serviceType: true },
        });
        if (existing) {
          const updates: Record<string, unknown> = {};
          if (!existing.revenueAccountId && revenueAccountId) updates.revenueAccountId = revenueAccountId;
          if (service.type === 'FIXED' && existing.serviceType === 'STANDARD') updates.serviceType = 'FIXED';
          if (Object.keys(updates).length > 0) {
            await tx.service.update({ where: { id: existing.id }, data: updates as any });
          }
          continue;
        }
        const existingByName = await tx.service.findFirst({
          where: { tenantId, categoryId: category.id, nameAr: service.name, deletedAt: null },
          select: { id: true },
        });
        if (existingByName) continue;
        await tx.service.create({
          data: {
            tenantId,
            categoryId: category.id,
            code: service.code,
            name: service.name,
            nameAr: service.name,
            nameEn: service.nameEn,
            serviceType: service.type,
            pricingUnit: service.unit,
            revenueAccountId,
            priceSYP: 0,
            priceUSD: 0,
            basePrice: 0,
            isActive: true,
          },
        });
      }
      return categories;
    }, { isolationLevel: 'Serializable' });
  }

  async getAllCategories(tenantId: string) {
    const categories = await prisma.serviceCategory.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        revenueAccount: { select: { id: true, code: true, nameAr: true } },
        costAccount: { select: { id: true, code: true, nameAr: true } },
        costCenter: { select: { id: true, code: true, nameAr: true } },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map((cat) => ({
      ...cat,
      serviceCount: cat._count.services,
    }));
  }

  async getCategoryById(id: string, tenantId: string) {
    return prisma.serviceCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        revenueAccount: { select: { id: true, code: true, nameAr: true } },
        costAccount: { select: { id: true, code: true, nameAr: true } },
        costCenter: { select: { id: true, code: true, nameAr: true } },
        _count: {
          select: { services: true },
        },
      },
    });
  }

  async createCategory(data: {
    tenantId: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    description?: string;
    revenueAccountId?: string | null;
    costAccountId?: string | null;
    costCenterId?: string | null;
  }) {
    if (data.revenueAccountId) {
      await this.assertRevenueAccount(data.tenantId, data.revenueAccountId);
    }
    if (data.costAccountId) await this.assertCostAccount(data.tenantId, data.costAccountId);
    if (data.costCenterId) await this.assertCostCenter(data.tenantId, data.costCenterId);
    return prisma.serviceCategory.create({
      data: {
        ...data,
        nameAr: data.nameAr || data.name,
      },
    });
  }

  async updateCategory(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      nameAr?: string;
      nameEn?: string;
      description?: string;
      isActive?: boolean;
      revenueAccountId?: string | null;
      costAccountId?: string | null;
      costCenterId?: string | null;
    }
  ) {
    if (data.revenueAccountId) {
      await this.assertRevenueAccount(tenantId, data.revenueAccountId);
    }
    if (data.costAccountId) await this.assertCostAccount(tenantId, data.costAccountId);
    if (data.costCenterId) await this.assertCostCenter(tenantId, data.costCenterId);
    return prisma.serviceCategory.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
  }

  async deleteCategory(id: string, tenantId: string) {
    // Check if category has services
    const category = await prisma.serviceCategory.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { services: true } } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.services > 0) {
      throw new Error('Cannot delete category with services');
    }

    const result = await prisma.serviceCategory.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { isActive: false, deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new Error('Category not found');
    }
    return result;
  }

  private async assertRevenueAccount(tenantId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId, isActive: true, deletedAt: null },
      select: { accountType: true, children: { select: { id: true } } },
    });
    if (!account || account.accountType !== AccountType.REVENUE) {
      throw new Error('Revenue account must be an active revenue account in this tenant');
    }
    if (account.children.length > 0) {
      throw new Error('Revenue account must be a posting account, not a parent');
    }
  }

  private async findDefaultRevenueAccountId(
    tx: Prisma.TransactionClient,
    tenantId: string,
    role: keyof typeof DEFAULT_ACCOUNT_CODES
  ): Promise<string | null> {
    const mapping = await tx.accountPostingMap.findFirst({
      where: {
        tenantId,
        mappingKey: role,
        isActive: true,
        account: { isActive: true, accountType: AccountType.REVENUE },
      },
      select: { accountId: true },
    });
    if (mapping) return mapping.accountId;

    const account = await tx.account.findFirst({
      where: {
        tenantId,
        code: DEFAULT_ACCOUNT_CODES[role],
        isActive: true,
        deletedAt: null,
        accountType: AccountType.REVENUE,
      },
      select: { id: true },
    });
    return account?.id || null;
  }

  private async assertCostCenter(tenantId: string, costCenterId: string) {
    const center = await prisma.costCenter.findFirst({
      where: { id: costCenterId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!center) throw new Error('Cost center must be active in this tenant');
  }

  private async assertCostAccount(tenantId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId, isActive: true, deletedAt: null },
      select: { accountType: true, children: { select: { id: true } } },
    });
    if (!account || account.accountType !== AccountType.COGS) {
      throw new Error('Cost account must be an active cost-of-services account in this tenant');
    }
    if (account.children.length > 0) {
      throw new Error('Cost account must be a posting account, not a parent');
    }
  }

  private async findDefaultCostCenterId(
    tx: Prisma.TransactionClient,
    tenantId: string,
    code: string
  ): Promise<string | null> {
    const center = await tx.costCenter.findFirst({
      where: { tenantId, code, isActive: true },
      select: { id: true },
    });
    return center?.id || null;
  }

  private async findDefaultCostAccountId(
    tx: Prisma.TransactionClient,
    tenantId: string,
    role: keyof typeof DEFAULT_ACCOUNT_CODES
  ): Promise<string | null> {
    const mapping = await tx.accountPostingMap.findFirst({
      where: {
        tenantId,
        mappingKey: role,
        isActive: true,
        account: { isActive: true, accountType: AccountType.COGS },
      },
      select: { accountId: true },
    });
    if (mapping) return mapping.accountId;

    const account = await tx.account.findFirst({
      where: {
        tenantId,
        code: DEFAULT_ACCOUNT_CODES[role],
        isActive: true,
        deletedAt: null,
        accountType: AccountType.COGS,
      },
      select: { id: true },
    });
    return account?.id || null;
  }
}
