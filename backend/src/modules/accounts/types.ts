import { AccountType } from '@prisma/client';

export interface Account {
  id: string;
  tenantId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  parentId: string | null;
  accountType: AccountType;
  balanceSYP: number;
  balanceUSD: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Account[];
  parent?: Account;
}

export interface CreateAccountDto {
  code: string;
  nameAr: string;
  nameEn?: string;
  parentId?: string | null;
  accountType: AccountType;
  isActive?: boolean;
  balanceSYP?: number;
  balanceUSD?: number;
}

export interface UpdateAccountDto {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string | null;
  accountType?: AccountType;
  isActive?: boolean;
  balanceSYP?: number;
  balanceUSD?: number;
}

export interface AccountFilters {
  accountType?: AccountType;
  parentId?: string | null;
  isActive?: boolean;
  search?: string;
}

export interface AccountTreeResponse {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  accountType: AccountType;
  balanceSYP: number;
  balanceUSD: number;
  isActive: boolean;
  children: AccountTreeResponse[];
  level: number;
}

export interface AccountBalanceResponse {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  accountType: AccountType;
  balanceSYP: number;
  balanceUSD: number;
}