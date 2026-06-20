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

export class SetupWizardService {
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

    // Check if already initialized
    const existingTenants = await prisma.tenant.count();
    if (existingTenants > 0) {
      throw new Error('System already initialized');
    }

    // Create tenant with default ID
    const tenant = await prisma.tenant.create({
      data: {
        id: 'default',
        name: data.tenantName,
        nameAr: data.tenantNameAr || data.tenantName,
        nameEn: data.tenantNameEn || data.tenantName,
        isActive: true,
      },
    });

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: data.branchName,
        nameAr: data.branchNameAr || data.branchName,
        nameEn: data.branchNameEn || data.branchName,
        isActive: true,
      },
    });

    // Create first admin user
    const passwordHash = await hashPassword(data.adminPassword);
    const user = await prisma.user.create({
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

    // Create company settings
    await prisma.companySettings.create({
      data: {
        tenantId: tenant.id,
        companyName: data.tenantName,
        companyNameAr: data.tenantNameAr || data.tenantName,
        companyNameEn: data.tenantNameEn || data.tenantName,
        setupStep: 0,
        setupCompleted: false,
      },
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
    // Use updateMany to avoid FK constraint issues from upsert create branch
    await prisma.companySettings.updateMany({
      where: { tenantId },
      data: {
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
        setupStep: 1,
      },
    });
  }

  /**
   * Step 2: Save financial settings
   */
  async saveStep2(tenantId: string, data: SetupStep2Financial): Promise<void> {
    // Create fiscal period if provided
    if (data.fiscalPeriodName && data.fiscalStartDate && data.fiscalEndDate) {
      const existing = await prisma.fiscalPeriod.findFirst({
        where: { tenantId, name: data.fiscalPeriodName },
      });
      if (!existing) {
        await prisma.fiscalPeriod.create({
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

    await prisma.companySettings.update({
      where: { tenantId },
      data: {
        exchangeRate: data.exchangeRate,
        taxRate: data.taxRate,
        overheadPercentage: data.overheadPercentage,
        monthlyWorkingHours: data.monthlyWorkingHours,
        serviceOverheadPercent: data.serviceOverheadPercent,
        invoicePrefix: data.invoicePrefix,
        autoGenerateInvoiceNumber: data.autoGenerateInvoiceNumber,
        setupStep: 2,
      },
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

    const existingCount = await prisma.account.count({ where: { tenantId } });
    if (existingCount > 0) {
      await this.updateSetupStep(tenantId, 3);
      return { created: 0, message: 'Accounts already exist, skipped' };
    }

    // Create accounts in order (parents first)
    const createdAccounts: Record<string, string> = {}; // code -> id
    let created = 0;

    // First pass: create all accounts without parent
    for (const acc of DEFAULT_ACCOUNTS) {
      try {
        const existing = await prisma.account.findFirst({
          where: { tenantId, code: acc.code },
        });
        if (existing) {
          createdAccounts[acc.code] = existing.id;
          continue;
        }

        const createdAccount = await prisma.account.create({
          data: {
            tenantId,
            code: acc.code,
            nameAr: acc.nameAr,
            nameEn: acc.nameEn,
            accountType: acc.accountType as any,
            category: acc.category as any || undefined,
            isActive: true,
            balanceSYP: 0,
            balanceUSD: 0,
          },
        });
        createdAccounts[acc.code] = createdAccount.id;
        created++;
      } catch (err: any) {
        Logger.error(`Failed to create account ${acc.code}:`, err.message);
      }
    }

    // Second pass: link parents
    for (const acc of DEFAULT_ACCOUNTS) {
      if (acc.parentCode && createdAccounts[acc.code] && createdAccounts[acc.parentCode]) {
        try {
          await prisma.account.update({
            where: { id: createdAccounts[acc.code] },
            data: { parentId: createdAccounts[acc.parentCode] },
          });
        } catch (err: any) {
          Logger.error(`Failed to link parent for ${acc.code}:`, err.message);
        }
      }
    }

    // Apply opening balances if provided
    if (data.openingBalanceSYP && createdAccounts['1110']) {
      await prisma.account.update({
        where: { id: createdAccounts['1110'] },
        data: { balanceSYP: data.openingBalanceSYP },
      });
    }
    if (data.openingBalanceUSD && createdAccounts['1120']) {
      await prisma.account.update({
        where: { id: createdAccounts['1120'] },
        data: { balanceUSD: data.openingBalanceUSD },
      });
    }

    await this.updateSetupStep(tenantId, 3);
    return { created, message: `Created ${created} accounts successfully` };
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
            code: cc.code,
            type: cc.type as any,
            costDriver: 'OTHER' as any,
            monthlyBudget: 0,
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
    await prisma.companySettings.update({
      where: { tenantId },
      data: {
        setupCompleted: true,
        setupStep: 7,
      },
    });
  }

  /**
   * Helper: update setup step only
   */
  private async updateSetupStep(tenantId: string, step: number): Promise<void> {
    await prisma.companySettings.update({
      where: { tenantId },
      data: { setupStep: step },
    });
  }
}

export const setupWizardService = new SetupWizardService();
