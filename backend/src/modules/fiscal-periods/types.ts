import { FiscalPeriodStatus } from '@prisma/client';

export interface FiscalPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFiscalPeriodDto {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateFiscalPeriodDto {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface FiscalPeriodFilters {
  status?: FiscalPeriodStatus;
  year?: number;
  isActive?: boolean;
}

export interface FiscalPeriodSummary {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;
  isClosed: boolean;
  journalEntriesCount: number;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}