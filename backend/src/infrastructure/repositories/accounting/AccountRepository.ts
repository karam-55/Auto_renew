import { IAccountRepository } from '../../../application/accounting/interfaces/IAccountRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';
import { DEFAULT_ACCOUNT_CODES } from '../../../modules/accounting/chart-of-accounts.defaults';

export class AccountRepository implements IAccountRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const account = await prisma.account.findUnique({
        where: { id },
      });
      return account;
    } catch (error) {
      throw new DatabaseError('Failed to find account by id', error);
    }
  }

  async findByCode(code: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const account = await prisma.account.findFirst({
        where: { code },
      });
      return account;
    } catch (error) {
      throw new DatabaseError('Failed to find account by code', error);
    }
  }

  async findByRole(tenantId: string, role: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      if (!(role in DEFAULT_ACCOUNT_CODES)) return null;
      const mapping = await prisma.accountPostingMap.findFirst({
        where: { tenantId, mappingKey: role },
        include: { account: true },
      });
      if (mapping) {
        if (!mapping.isActive || !mapping.account.isActive || mapping.account.deletedAt || mapping.account.tenantId !== tenantId) {
          return null;
        }
        return mapping.account;
      }
      return prisma.account.findFirst({
        where: {
          tenantId,
          code: DEFAULT_ACCOUNT_CODES[role as keyof typeof DEFAULT_ACCOUNT_CODES],
          isActive: true,
          deletedAt: null,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to find account by posting role', error);
    }
  }

  async save(account: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.account.create({
        data: {
          id: account.id,
          tenantId: account.tenantId,
          code: account.code,
          nameAr: account.nameAr,
          nameEn: account.nameEn,
          parentId: account.parentId,
          accountType: account.accountType,
          balanceSYP: account.balanceSYP || 0,
          balanceUSD: account.balanceUSD || 0,
          isActive: account.isActive ?? true,
        },
      });
      return created;
    } catch (error) {
      throw new DatabaseError('Failed to save account', error);
    }
  }

  async update(account: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.account.update({
        where: { id: account.id },
        data: {
          nameAr: account.nameAr,
          nameEn: account.nameEn,
          parentId: account.parentId,
          accountType: account.accountType,
          balanceSYP: account.balanceSYP,
          balanceUSD: account.balanceUSD,
          isActive: account.isActive,
        },
      });
      return updated;
    } catch (error) {
      throw new DatabaseError('Failed to update account', error);
    }
  }

  async list(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const accounts = await prisma.account.findMany({
        where: { tenantId },
        orderBy: { code: 'asc' },
      });
      return accounts;
    } catch (error) {
      throw new DatabaseError('Failed to list accounts', error);
    }
  }

  async getTree(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const accounts = await prisma.account.findMany({
        where: { tenantId },
        orderBy: { code: 'asc' },
        include: {
          children: true,
        },
      });

      // Build tree structure
      const accountMap = new Map<string, any>();
      const rootAccounts: any[] = [];

      // First pass: create map of all accounts
      accounts.forEach((account: any) => {
        accountMap.set(account.id, { ...account, children: [] });
      });

      // Second pass: build hierarchy
      accounts.forEach((account: any) => {
        const accountNode = accountMap.get(account.id);
        if (account.parentId && accountMap.has(account.parentId)) {
          const parent = accountMap.get(account.parentId);
          parent.children.push(accountNode);
        } else {
          rootAccounts.push(accountNode);
        }
      });

      return rootAccounts;
    } catch (error) {
      throw new DatabaseError('Failed to get account tree', error);
    }
  }
}
