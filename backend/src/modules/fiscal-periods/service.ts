import prisma from '../../config/database';
import {
  FiscalPeriod,
  CreateFiscalPeriodDto,
  UpdateFiscalPeriodDto,
  FiscalPeriodFilters,
  FiscalPeriodSummary,
} from './types';
import { FiscalPeriodStatus } from '@prisma/client';

export class FiscalPeriodService {
  /**
   * Create a new fiscal period
   * Validates date ranges and prevents overlapping periods
   */
  async createFiscalPeriod(tenantId: string, data: CreateFiscalPeriodDto): Promise<FiscalPeriod> {
    // Validate date range
    if (data.startDate >= data.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Check for overlapping periods
    const overlappingPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingPeriod) {
      throw new Error('Fiscal period overlaps with an existing period');
    }

    const fiscalPeriod = await prisma.fiscalPeriod.create({
      data: {
        tenantId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: FiscalPeriodStatus.ACTIVE,
      },
    });

    return this.mapToFiscalPeriodResponse(fiscalPeriod);
  }

  /**
   * Get all fiscal periods with optional filters
   */
  async getFiscalPeriods(
    tenantId: string,
    filters: FiscalPeriodFilters = {}
  ): Promise<FiscalPeriod[]> {
    const where: any = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.year) {
      where.startDate = {
        gte: new Date(filters.year, 0, 1),
        lte: new Date(filters.year, 11, 31),
      };
    }
    if (filters.isActive !== undefined) {
      where.status = filters.isActive ? FiscalPeriodStatus.ACTIVE : FiscalPeriodStatus.CLOSED;
    }

    const periods = await prisma.fiscalPeriod.findMany({
      where,
      orderBy: [{ startDate: 'desc' }],
    });

    return periods.map((period) => this.mapToFiscalPeriodResponse(period));
  }

  /**
   * Get fiscal period by ID
   */
  async getFiscalPeriodById(tenantId: string, periodId: string): Promise<FiscalPeriod | null> {
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      return null;
    }

    return this.mapToFiscalPeriodResponse(period);
  }

  /**
   * Update fiscal period
   * Prevents modifications to closed periods
   */
  async updateFiscalPeriod(
    tenantId: string,
    periodId: string,
    data: UpdateFiscalPeriodDto
  ): Promise<FiscalPeriod> {
    const existingPeriod = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!existingPeriod) {
      throw new Error('Fiscal period not found');
    }

    // Prevent modifications to closed periods
    if (existingPeriod.status === FiscalPeriodStatus.CLOSED) {
      throw new Error('Cannot modify a closed fiscal period');
    }

    // Validate date range if provided
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new Error('Start date must be before end date');
    }

    // Check for overlapping periods if dates are changing
    if (data.startDate || data.endDate) {
      const startDate = data.startDate || existingPeriod.startDate;
      const endDate = data.endDate || existingPeriod.endDate;

      const overlappingPeriod = await prisma.fiscalPeriod.findFirst({
        where: {
          tenantId,
          id: { not: periodId },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlappingPeriod) {
        throw new Error('Fiscal period overlaps with an existing period');
      }
    }

    const updatedPeriod = await prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
      },
    });

    return this.mapToFiscalPeriodResponse(updatedPeriod);
  }

  /**
   * Close fiscal period
   * Validates that the period is balanced and prevents further modifications
   */
  async closeFiscalPeriod(tenantId: string, periodId: string, userId: string): Promise<FiscalPeriod> {
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      throw new Error('Fiscal period not found');
    }

    if (period.status === FiscalPeriodStatus.CLOSED) {
      throw new Error('Fiscal period is already closed');
    }

    // Check if period is balanced
    const summary = await this.getFiscalPeriodSummary(tenantId, periodId);
    if (!summary.isBalanced) {
      throw new Error('Cannot close fiscal period: journal entries are not balanced');
    }

    // Close the period
    const closedPeriod = await prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        status: FiscalPeriodStatus.CLOSED,
        isClosed: true,
      },
    });

    return this.mapToFiscalPeriodResponse(closedPeriod);
  }

  /**
   * Reopen fiscal period (only for OWNER or MANAGER)
   */
  async reopenFiscalPeriod(tenantId: string, periodId: string): Promise<FiscalPeriod> {
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      throw new Error('Fiscal period not found');
    }

    if (period.status !== FiscalPeriodStatus.CLOSED) {
      throw new Error('Fiscal period is not closed');
    }

    const reopenedPeriod = await prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        status: FiscalPeriodStatus.ACTIVE,
        isClosed: false,
      },
    });

    return this.mapToFiscalPeriodResponse(reopenedPeriod);
  }

  /**
   * Delete fiscal period
   * Only allowed if no journal entries exist
   */
  async deleteFiscalPeriod(tenantId: string, periodId: string): Promise<void> {
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      throw new Error('Fiscal period not found');
    }

    // Check if period has journal entries
    const journalEntriesCount = await prisma.journalEntry.count({
      where: { fiscalPeriodId: periodId },
    });

    if (journalEntriesCount > 0) {
      throw new Error('Cannot delete fiscal period with journal entries');
    }

    await prisma.fiscalPeriod.delete({
      where: { id: periodId },
    });
  }

  /**
   * Get fiscal period summary
   */
  async getFiscalPeriodSummary(tenantId: string, periodId: string): Promise<FiscalPeriodSummary> {
    const period = await prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
    });

    if (!period) {
      throw new Error('Fiscal period not found');
    }

    const journalEntries = await prisma.journalEntry.findMany({
      where: { fiscalPeriodId: periodId },
      include: {
        lines: true,
      },
    });

    let totalDebit = 0;
    let totalCredit = 0;

    journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        totalDebit += Number(line.debitSYP);
        totalCredit += Number(line.creditSYP);
      });
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // Allow for floating point errors

    return {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      isClosed: period.isClosed,
      journalEntriesCount: journalEntries.length,
      totalDebit,
      totalCredit,
      isBalanced,
    };
  }

  /**
   * Get current active fiscal period
   */
  async getCurrentFiscalPeriod(tenantId: string): Promise<FiscalPeriod | null> {
    const now = new Date();

    const period = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        status: FiscalPeriodStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!period) {
      return null;
    }

    return this.mapToFiscalPeriodResponse(period);
  }

  /**
   * Map Prisma fiscal period to FiscalPeriod response
   */
  private mapToFiscalPeriodResponse(period: any): FiscalPeriod {
    return {
      id: period.id,
      tenantId: period.tenantId,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      isClosed: period.isClosed,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
    };
  }
}