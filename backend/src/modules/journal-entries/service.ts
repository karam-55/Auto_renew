import prisma from '../../config/database';
import {
  JournalEntry,
  JournalLine,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  JournalEntryFilters,
  JournalEntrySummary,
  CreateJournalLineDto,
} from './types';
import { JournalEntryStatus, FiscalPeriodStatus } from '@prisma/client';
import { AccountService } from '../accounts/service';

export class JournalEntryService {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(tenantId: string, userId: string, data: CreateJournalEntryDto): Promise<JournalEntry> {
    // Validate fiscal period exists and is open
    if (data.fiscalPeriodId) {
      const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
        where: { id: data.fiscalPeriodId, tenantId },
      });

      if (!fiscalPeriod) {
        throw new Error('Fiscal period not found');
      }

      if (fiscalPeriod.status !== FiscalPeriodStatus.ACTIVE) {
        throw new Error('Cannot create journal entry in a closed fiscal period');
      }

      // Validate entry date is within fiscal period
      if (data.entryDate < fiscalPeriod.startDate || data.entryDate > fiscalPeriod.endDate) {
        throw new Error('Entry date must be within fiscal period range');
      }
    }

    // Validate lines exist
    if (!data.lines || data.lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    // Validate all accounts exist and belong to tenant
    const accountIds = data.lines.map((line) => line.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, tenantId },
    });

    if (accounts.length !== accountIds.length) {
      throw new Error('One or more accounts not found');
    }

    // Calculate totals and validate balance
    let totalDebitSYP = 0;
    let totalCreditSYP = 0;

    for (const line of data.lines) {
      totalDebitSYP += line.debitSYP;
      totalCreditSYP += line.creditSYP;
    }

    // Check if entry is balanced (allow for small floating point errors)
    const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;
    if (!isBalanced) {
      throw new Error(`Journal entry is not balanced: Debit ${totalDebitSYP} != Credit ${totalCreditSYP}`);
    }

    // Create journal entry with lines in a transaction
    const journalEntry = await prisma.$transaction(async (tx) => {
      // Create journal entry
      const entry = await tx.journalEntry.create({
        data: {
          tenantId,
          entryDate: data.entryDate,
          description: data.description,
          reference: data.reference,
          fiscalPeriodId: data.fiscalPeriodId,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          status: JournalEntryStatus.POSTED,
          createdById: userId,
        },
      });

      // Create journal lines
      const lines = await Promise.all(
        data.lines.map((line) =>
          tx.journalLine.create({
            data: {
              entryId: entry.id,
              accountId: line.accountId,
              description: line.description,
              debitSYP: line.debitSYP,
              debitUSD: line.debitUSD || 0,
              creditSYP: line.creditSYP,
              creditUSD: line.creditUSD || 0,
              sourceType: line.sourceType,
              sourceId: line.sourceId,
            },
          })
        )
      );

      // Update account balances
      for (const line of lines) {
        if (Number(line.debitSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.debitSYP),
            true
          );
        }
        if (Number(line.creditSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.creditSYP),
            false
          );
        }
      }

      return { entry, lines };
    });

    return this.mapToJournalEntryResponse(journalEntry.entry, journalEntry.lines);
  }

  /**
   * Get all journal entries with optional filters
   */
  async getJournalEntries(
    tenantId: string,
    filters: JournalEntryFilters = {}
  ): Promise<JournalEntry[]> {
    const where: any = { tenantId };

    if (filters.fiscalPeriodId) {
      where.fiscalPeriodId = filters.fiscalPeriodId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.entryDate = {};
      if (filters.dateFrom) {
        where.entryDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.entryDate.lte = filters.dateTo;
      }
    }
    if (filters.sourceType) {
      where.sourceType = filters.sourceType;
    }
    if (filters.sourceId) {
      where.sourceId = filters.sourceId;
    }
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const limit = Math.min(filters.limit || 50, 200); // Max 200
    const offset = filters.offset || 0;

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: [{ entryDate: 'desc' }],
      take: limit,
      skip: offset,
    });

    return entries.map((entry: any) => this.mapToJournalEntryResponse(entry, entry.lines));
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(tenantId: string, entryId: string): Promise<JournalEntry | null> {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, tenantId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
        fiscalPeriod: true,
        createdBy: true,
        approvedBy: true,
      },
    });

    if (!entry) {
      return null;
    }

    return this.mapToJournalEntryResponse(entry, entry.lines);
  }

  /**
   * Update journal entry
   * Only allowed if fiscal period is open and entry is not locked
   */
  async updateJournalEntry(
    tenantId: string,
    entryId: string,
    data: UpdateJournalEntryDto
  ): Promise<JournalEntry> {
    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id: entryId, tenantId },
      include: {
        fiscalPeriod: true,
        lines: true,
      },
    });

    if (!existingEntry) {
      throw new Error('Journal entry not found');
    }

    // Check if fiscal period is open
    if (existingEntry.fiscalPeriod && existingEntry.fiscalPeriod.status !== FiscalPeriodStatus.ACTIVE) {
      throw new Error('Cannot modify journal entry in a closed fiscal period');
    }

    // If updating lines, reverse old balances first
    if (data.lines && data.lines.length > 0) {
      // Reverse old balances
      for (const line of existingEntry.lines) {
        if (Number(line.debitSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.debitSYP),
            false // Reverse the transaction
          );
        }
        if (Number(line.creditSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.creditSYP),
            true // Reverse the transaction
          );
        }
      }

      // Delete old lines
      await prisma.journalLine.deleteMany({
        where: { entryId },
      });

      // Calculate new totals
      let totalDebitSYP = 0;
      let totalCreditSYP = 0;

      for (const line of data.lines) {
        totalDebitSYP += line.debitSYP;
        totalCreditSYP += line.creditSYP;
      }

      // Check if entry is balanced
      const isBalanced = Math.abs(totalDebitSYP - totalCreditSYP) < 0.01;
      if (!isBalanced) {
        throw new Error(`Journal entry is not balanced: Debit ${totalDebitSYP} != Credit ${totalCreditSYP}`);
      }

      // Create new lines
      const lines = await Promise.all(
        data.lines.map((line) =>
          prisma.journalLine.create({
            data: {
              entryId,
              accountId: line.accountId,
              description: line.description,
              debitSYP: line.debitSYP,
              debitUSD: line.debitUSD || 0,
              creditSYP: line.creditSYP,
              creditUSD: line.creditUSD || 0,
              sourceType: line.sourceType,
              sourceId: line.sourceId,
            },
          })
        )
      );

      // Update account balances
      for (const line of lines) {
        if (Number(line.debitSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.debitSYP),
            true
          );
        }
        if (Number(line.creditSYP) > 0) {
          await this.accountService.updateAccountBalance(
            line.accountId,
            Number(line.creditSYP),
            false
          );
        }
      }

      // Update entry
      const updatedEntry = await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          entryDate: data.entryDate,
          description: data.description,
          reference: data.reference,
        },
      });

      return this.mapToJournalEntryResponse(updatedEntry, lines);
    } else {
      // Just update basic fields
      const updatedEntry = await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          entryDate: data.entryDate,
          description: data.description,
          reference: data.reference,
        },
      });

      return this.mapToJournalEntryResponse(updatedEntry, existingEntry.lines);
    }
  }

  /**
   * Delete journal entry
   * Only allowed if fiscal period is open and entry is not locked
   */
  async deleteJournalEntry(tenantId: string, entryId: string): Promise<void> {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, tenantId },
      include: {
        fiscalPeriod: true,
        lines: true,
      },
    });

    if (!entry) {
      throw new Error('Journal entry not found');
    }

    // Check if fiscal period is open
    if (entry.fiscalPeriod && entry.fiscalPeriod.status !== FiscalPeriodStatus.ACTIVE) {
      throw new Error('Cannot delete journal entry in a closed fiscal period');
    }

    // Reverse account balances
    for (const line of entry.lines) {
      if (Number(line.debitSYP) > 0) {
        await this.accountService.updateAccountBalance(
          line.accountId,
          Number(line.debitSYP),
          false // Reverse the transaction
        );
      }
      if (Number(line.creditSYP) > 0) {
        await this.accountService.updateAccountBalance(
          line.accountId,
          Number(line.creditSYP),
          true // Reverse the transaction
        );
      }
    }

    await prisma.journalEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Get journal entry summaries (lightweight version for lists)
   */
  async getJournalEntrySummaries(tenantId: string, filters: JournalEntryFilters = {}): Promise<JournalEntrySummary[]> {
    const where: any = { tenantId };

    if (filters.fiscalPeriodId) {
      where.fiscalPeriodId = filters.fiscalPeriodId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.entryDate = {};
      if (filters.dateFrom) {
        where.entryDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.entryDate.lte = filters.dateTo;
      }
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        _count: {
          select: { lines: true },
        },
      },
      orderBy: [{ entryDate: 'desc' }],
    });

    return entries.map((entry) => ({
      id: entry.id,
      entryDate: entry.entryDate,
      description: entry.description,
      status: entry.status,
      lineCount: entry._count.lines,
    }));
  }

  /**
   * Map Prisma journal entry to response format
   */
  private mapToJournalEntryResponse(entry: any, lines: any[]): JournalEntry {
    return {
      id: entry.id,
      tenantId: entry.tenantId,
      entryDate: entry.entryDate,
      reference: entry.reference,
      description: entry.description,
      status: entry.status,
      isReversing: entry.isReversing,
      reversingDate: entry.reversingDate,
      isReversed: entry.isReversed,
      fiscalPeriodId: entry.fiscalPeriodId,
      sourceType: entry.sourceType,
      sourceId: entry.sourceId,
      createdById: entry.createdById,
      approvedById: entry.approvedById,
      approvedAt: entry.approvedAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lines: lines.map((line) => ({
        id: line.id,
        entryId: line.entryId,
        accountId: line.accountId,
        accountName: line.accountName,
        description: line.description,
        debitSYP: Number(line.debitSYP),
        debitUSD: Number(line.debitUSD),
        creditSYP: Number(line.creditSYP),
        creditUSD: Number(line.creditUSD),
        sourceType: line.sourceType,
        sourceId: line.sourceId,
        createdAt: line.createdAt,
      })),
      fiscalPeriod: entry.fiscalPeriod,
      createdBy: entry.createdBy,
      approvedBy: entry.approvedBy,
    };
  }
}
