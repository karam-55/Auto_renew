import { JournalEntryStatus } from '@prisma/client';

export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  accountName: string | null;
  description: string | null;
  debitSYP: number;
  debitUSD: number;
  creditSYP: number;
  creditUSD: number;
  sourceType: string | null;
  sourceId: string | null;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  entryDate: Date;
  reference: string | null;
  description: string;
  status: JournalEntryStatus;
  isReversing: boolean;
  reversingDate: Date | null;
  isReversed: boolean;
  fiscalPeriodId: string | null;
  sourceType: string | null;
  sourceId: string | null;
  createdById: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: JournalLine[];
  fiscalPeriod?: any;
  createdBy?: any;
  approvedBy?: any;
}

export interface CreateJournalLineDto {
  accountId: string;
  description?: string;
  debitSYP: number;
  debitUSD?: number;
  creditSYP: number;
  creditUSD?: number;
  sourceType?: string;
  sourceId?: string;
}

export interface CreateJournalEntryDto {
  entryDate: Date;
  description: string;
  reference?: string;
  fiscalPeriodId?: string;
  sourceType?: string;
  sourceId?: string;
  lines: CreateJournalLineDto[];
}

export interface UpdateJournalEntryDto {
  entryDate?: Date;
  description?: string;
  reference?: string;
  lines?: CreateJournalLineDto[];
}

export interface JournalEntryFilters {
  fiscalPeriodId?: string;
  status?: JournalEntryStatus;
  dateFrom?: Date;
  dateTo?: Date;
  sourceType?: string;
  sourceId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface JournalEntrySummary {
  id: string;
  entryDate: Date;
  description: string;
  status: JournalEntryStatus;
  lineCount: number;
}