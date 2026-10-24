import prisma from '../../config/database';
import { Logger } from '../../infrastructure/logging/logger';
import {
  SetupStep1Company,
  SetupStep2Financial,
  SetupStep3ChartOfAccounts,
  SetupStep4AssetCategories,
  SetupStep5CostCenters,
  SetupStep6Users,
  SetupWizardStatus,
  DEFAULT_ACCOUNTS,
  DEFAULT_ASSET_CATEGORIES,
  DEFAULT_COST_CENTERS,
} from './types';
import { hashPassword, generateTokens } from '../../shared/utils/auth';
import { createJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';
import { DEFAULT_ACCOUNT_CODES } from '../accounting/chart-of-accounts.defaults';
import { ServiceCategoryService } from '../services/service-category.service';

export class SetupWizardService {
  private serviceCategoryService = new ServiceCategoryService();

  /**
   * Get current setup wizard status for tenant
   */
  async getStatus(tenantId: string): Promise<SetupWizardStatus> {
    const settings = await prisma.companySettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return { setupCompleted: false, setupStep: 0 };
    }

    return {
      setupCompleted: (settings as any).setupCompleted ?? false,
      setupStep: (settings as any).setupStep ?? 0,
      companyName: settings.companyName || undefined,
    };
  }

  /**
   * Check if system needs initial setup (no tenants/users exist)
   */
  async needsInit(): Promise<boolean> {
    const count = await prisma.tenant.count();
    return count === 0;
  }

  /**
   * Initialize system: create tenant, branch, first admin user
   */
  async init(data: {
    tenantName: string;
    tenantNameAr?: string;
    tenantNameEn?: string;
    branchName: string;
    branchNameAr?: string;
    branchNameEn?: string;
    adminFullName: string;
    adminUsername: string;
    adminPassword: string;
    adminPhone?: string;
  }): Promise<{
    tenant: any;
    branch: any;
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // Validate
    if (!data.tenantName || !data.branchName || !data.adminFullName || !data.adminUsername || !data.adminPassword) {
      throw new Error('All required fields must be provided');
    }
    if (data.adminPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const passwordHash = await hashPassword(data.adminPassword);
    const { tenant, branch, user } = await prisma.$transaction(async (tx) => {
      if (await tx.tenant.count() > 0) {
        throw new Error('System already initialized');
      }

      const tenant = await tx.tenant.create({
        data: {
          id: 'default',
          name: data.tenantName,
          nameAr: data.tenantNameAr || data.tenantName,
          nameEn: data.tenantNameEn || data.tenantName,
          isActive: true,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: data.branchName,
          nameAr: data.branchNameAr || data.branchName,
          nameEn: data.branchNameEn || data.branchName,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: data.adminFullName,
          username: data.adminUsername,
          passwordHash,
          phone: data.adminPhone || '0000000000',
          role: 'OWNER',
          isActive: true,
        },
      });

      const usdCurrency = await tx.currency.upsert({
        where: { code: 'USD' },
        update: {
          tenantId: tenant.id,
          name: 'US Dollar',
          nameAr: 'دولار أمريكي',
          nameEn: 'US Dollar',
          symbol: '$',
          isDefault: true,
          isActive: true,
          deletedAt: null,
          decimalPlaces: 2,
        },
        create: {
          tenantId: tenant.id,
          code: 'USD',
          name: 'US Dollar',
          nameAr: 'دولار أمريكي',
          nameEn: 'US Dollar',
          symbol: '$',
          isDefault: true,
          isActive: true,
          decimalPlaces: 2,
        },
      });
      await tx.currency.upsert({
        where: { code: 'SYP' },
        update: {
          tenantId: tenant.id,
          name: 'Syrian Pound',
          nameAr: 'ليرة سورية',
          nameEn: 'Syrian Pound',
          symbol: 'ل.س',
          isDefault: false,
          isActive: true,
          deletedAt: null,
          decimalPlaces: 2,
        },
        create: {
          tenantId: tenant.id,
          code: 'SYP',
          name: 'Syrian Pound',
          nameAr: 'ليرة سورية',
          nameEn: 'Syrian Pound',
          symbol: 'ل.س',
          isDefault: false,
          isActive: true,
          decimalPlaces: 2,
        },
      });

      await tx.companySettings.create({
        data: {
          tenantId: tenant.id,
          defaultCurrencyId: usdCurrency.id,
          companyName: data.tenantName,
          companyNameAr: data.tenantNameAr || data.tenantName,
          companyNameEn: data.tenantNameEn || data.tenantName,
          setupStep: 0,
          setupCompleted: false,
        },
      });

      return { tenant, branch, user };
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      tenantId: tenant.id,
      role: user.role,
      username: user.username,
    });

    return { tenant, branch, user, tokens };
  }

  /**
   * Step 1: Save company information
  */
  async saveStep1(tenantId: string, data: SetupStep1Company): Promise<void> {
    const selectedCurrency = await prisma.currency.findFirst({
      where: { tenantId, code: data.currency, isActive: true, deletedAt: null },
      select: { id: true },
    });
    await this.upsertCompanySettings(tenantId, {
        companyName: data.companyName,
        companyNameAr: data.companyNameAr,
        companyNameEn: data.companyNameEn,
        logoUrl: data.logoUrl,
        address: data.address,
        phone: data.phone,
        taxNumber: data.taxNumber,
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        ...(selectedCurrency ? { defaultCurrencyId: selectedCurrency.id } : {}),
        setupStep: 1,
    });
    if (selectedCurrency) {
      await prisma.currency.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
      await prisma.currency.update({
        where: { id: selectedCurrency.id },
        data: { isDefault: true },
      });
    }
  }

  /**
   * Step 2: Save financial settings
  */
  async saveStep2(tenantId: string, data: SetupStep2Financial): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await this.upsertCompanySettings(tenantId, {
        exchangeRate: data.exchangeRate,
        taxRate: data.taxRate,
        overheadPercentage: data.overheadPercentage,
        monthlyWorkingHours: data.monthlyWorkingHours,
        serviceOverheadPercent: data.serviceOverheadPercent,
        invoicePrefix: data.invoicePrefix,
        autoGenerateInvoiceNumber: data.autoGenerateInvoiceNumber,
        setupStep: 2,
      }, tx);

      if (data.fiscalPeriodName && data.fiscalStartDate && data.fiscalEndDate) {
        const existing = await tx.fiscalPeriod.findFirst({
          where: { tenantId, name: data.fiscalPeriodName },
        });
        if (!existing) {
          await tx.fiscalPeriod.create({
            data: {
              tenantId,
              name: data.fiscalPeriodName,
              startDate: new Date(data.fiscalStartDate),
              endDate: new Date(data.fiscalEndDate),
              status: 'ACTIVE',
            },
          });
        }
      }
    });
  }

  /**
   * Step 3: Initialize chart of accounts
   */
  async saveStep3(tenantId: string, data: SetupStep3ChartOfAccounts): Promise<{ created: number; message: string }> {
    if (!data.createDefaultAccounts) {
      await this.updateSetupStep(tenantId, 3);
      return { created: 0, message: 'Skipped chart of accounts creation' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.account.count({ where: { tenantId } });
      if (existingCount > 0) return { created: 0, skipped: true };

      const createdAccounts = new Map<string, string>();
      let created = 0;

      for (const account of DEFAULT_ACCOUNTS) {
        const createdAccount = await tx.account.create({
          data: {
            tenantId,
            code: account.code,
            nameAr: account.nameAr,
            nameEn: account.nameEn,
            accountType: account.accountType,
            category: account.category as any,
            isActive: true,
            balanceSYP: 0,
            balanceUSD: 0,
          },
          select: { id: true },
        });
        createdAccounts.set(account.code, createdAccount.id);
        created++;
      }

      for (const account of DEFAULT_ACCOUNTS) {
        if (!account.parentCode) continue;
        const accountId = createdAccounts.get(account.code);
        const parentId = createdAccounts.get(account.parentCode);
        if (!accountId || !parentId) {
          throw new Error(`Invalid default chart hierarchy for account ${account.code}`);
        }
        await tx.account.update({
          where: { id: accountId },
          data: { parentId },
        });
      }

      await ensureDefaultAccounts(tenantId, tx);

      const openingSYP = Number(data.openingBalanceSYP || 0);
      const openingUSD = Number(data.openingBalanceUSD || 0);
      if (openingSYP > 0 || openingUSD > 0) {
        const cashAccountId = createdAccounts.get(DEFAULT_ACCOUNT_CODES.CASH);
        const bankAccountId = createdAccounts.get(DEFAULT_ACCOUNT_CODES.BANK);
        const openingEquityAccountId = createdAccounts.get(DEFAULT_ACCOUNT_CODES.OPENING_BALANCE_EQUITY);
        if (!cashAccountId || !bankAccountId || !openingEquityAccountId) {
          throw new Error('Opening balance accounts are missing from the default chart');
        }

        const lines = [];
        if (openingSYP > 0) {
          lines.push({
            accountId: cashAccountId,
            debitSYP: openingSYP,
            debitUSD: 0,
            creditSYP: 0,
            creditUSD: 0,
            description: 'رصيد نقدية افتتاحي',
          });
        }
        if (openingUSD > 0) {
          lines.push({
            accountId: bankAccountId,
            debitSYP: 0,
            debitUSD: openingUSD,
            creditSYP: 0,
            creditUSD: 0,
            description: 'رصيد مصرفي افتتاحي',
          });
        }
        lines.push({
          accountId: openingEquityAccountId,
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: openingSYP,
          creditUSD: openingUSD,
          description: 'مقابل الأرصدة الافتتاحية',
        });

        await createJournalEntry(
          tenantId,
          new Date(),
          'قيد الأرصدة الافتتاحية للصندوق والبنك',
          `SETUP-OPENING-${tenantId}`,
          'OPENING_BALANCE',
          `SETUP-OPENING-${tenantId}`,
          null,
          lines,
          tx
        );
      }

      return { created, skipped: false };
    }, { isolationLevel: 'Serializable' });

    if (result.skipped) {
      await this.updateSetupStep(tenantId, 3);
      return { created: 0, message: 'Accounts already exist, skipped' };
    }

    await this.updateSetupStep(tenantId, 3);
    return { created: result.created, message: `Created ${result.created} accounts successfully` };
  }

  /**
   * Step 4: Initialize asset categories
   */
  async saveStep4(tenantId: string, data: SetupStep4AssetCategories): Promise<{ created: number; message: string }> {
    if (!data.createDefaultCategories) {
      await this.updateSetupStep(tenantId, 4);
      return { created: 0, message: 'Skipped asset categories creation' };
    }

    const existingCount = await prisma.assetCategory.count({ where: { tenantId } });
    if (existingCount > 0) {
      await this.updateSetupStep(tenantId, 4);
      return { created: 0, message: 'Asset categories already exist, skipped' };
    }

    let created = 0;
    for (const cat of DEFAULT_ASSET_CATEGORIES) {
      try {
        await prisma.assetCategory.create({
          data: {
            tenantId,
            name: cat.name,
            usefulLifeYears: cat.usefulLifeYears,
            depreciationMethod: cat.depreciationMethod as any,
            salvageValuePercent: cat.salvageValuePercent,
          },
        });
        created++;
      } catch (err: any) {
        Logger.error(`Failed to create asset category ${cat.name}:`, err.message);
      }
    }

    await this.updateSetupStep(tenantId, 4);
    return { created, message: `Created ${created} asset categories` };
  }

  /**
   * Step 5: Initialize cost centers
   */
  async saveStep5(tenantId: string, data: SetupStep5CostCenters): Promise<{ created: number; message: string }> {
    if (!data.createDefaultCenters) {
      await this.updateSetupStep(tenantId, 5);
      return { created: 0, message: 'Skipped cost centers creation' };
    }

    const existingCount = await prisma.costCenter.count({ where: { tenantId } });
    if (existingCount > 0) {
      await this.updateSetupStep(tenantId, 5);
      return { created: 0, message: 'Cost centers already exist, skipped' };
    }

    let created = 0;
    for (const cc of DEFAULT_COST_CENTERS) {
      try {
        await prisma.costCenter.create({
          data: {
            tenantId,
            name: cc.name,
            nameAr: cc.nameAr,
            code: cc.code,
            type: cc.type as any,
            costDriver: cc.costDriver as any,
            driverQuantity: cc.driverQuantity,
            monthlyBudget: cc.monthlyBudget,
            isActive: true,
          },
        });
        created++;
      } catch (err: any) {
        Logger.error(`Failed to create cost center ${cc.name}:`, err.message);
      }
    }

    await this.updateSetupStep(tenantId, 5);
    return { created, message: `Created ${created} cost centers` };
  }

  /**
   * Step 6: Create users
   */
  async saveStep6(tenantId: string, data: SetupStep6Users): Promise<{ created: number; message: string }> {
    let created = 0;
    for (const user of data.users) {
      try {
        const existing = await prisma.user.findFirst({
          where: { tenantId, username: user.username },
        });
        if (existing) continue;

        const passwordHash = await hashPassword(user.password);
        await prisma.user.create({
          data: {
            tenantId,
            fullName: user.fullName,
            username: user.username,
            passwordHash,
            phone: user.phone,
            role: user.role as any,
            isActive: true,
          },
        });
        created++;
      } catch (err: any) {
        Logger.error(`Failed to create user ${user.username}:`, err.message);
      }
    }

    await this.updateSetupStep(tenantId, 6);
    return { created, message: `Created ${created} users` };
  }

  /**
   * Complete wizard
   */
  async complete(tenantId: string): Promise<void> {
    await this.serviceCategoryService.initializeDefaultDepartments(tenantId);
    await this.upsertCompanySettings(tenantId, { setupCompleted: true, setupStep: 7 });
  }

  private async upsertCompanySettings(
    tenantId: string,
    data: Record<string, unknown>,
    client: any = prisma
  ): Promise<void> {
    const tenant = await client.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, nameAr: true, nameEn: true },
    });
    if (!tenant) {
      throw new Error('لم يتم إنشاء المنشأة بعد. ابدأ بإعداد النظام الأولي قبل حفظ الإعدادات.');
    }

    await client.companySettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        companyName: tenant.name,
        companyNameAr: tenant.nameAr || tenant.name,
        companyNameEn: tenant.nameEn || tenant.name,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Helper: update setup step only
   */
  private async updateSetupStep(tenantId: string, step: number): Promise<void> {
    await this.upsertCompanySettings(tenantId, { setupStep: step });
  }
}

export const setupWizardService = new SetupWizardService();
