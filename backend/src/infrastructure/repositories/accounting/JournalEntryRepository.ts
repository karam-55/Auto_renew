import { IJournalEntryRepository } from '../../../application/accounting/interfaces/IJournalEntryRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class JournalEntryRepository implements IJournalEntryRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const journalEntry = await prisma.journalEntry.findUnique({
        where: { id },
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
      });
      return journalEntry;
    } catch (error) {
      throw new DatabaseError('Failed to find journal entry by id', error);
    }
  }

  async save(journalEntry: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const created = await prisma.journalEntry.create({
        data: {
          id: journalEntry.id,
          tenantId: journalEntry.tenantId,
          entryDate: journalEntry.date,
          reference: journalEntry.reference,
          description: journalEntry.description,
          isReversing: journalEntry.isReversing || false,
          reversingDate: journalEntry.reversingDate,
          isReversed: journalEntry.isReversed || false,
          fiscalPeriodId: journalEntry.fiscalPeriodId,
          sourceType: journalEntry.sourceType,
          sourceId: journalEntry.sourceId,
          createdById: journalEntry.createdById,
          approvedById: journalEntry.approvedById,
          approvedAt: journalEntry.approvedAt,
          status: journalEntry.status || 'DRAFT',
        },
      });
      return created;
    } catch (error) {
      throw new DatabaseError('Failed to save journal entry', error);
    }
  }

  async listByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const journalEntries = await prisma.journalEntry.findMany({
        where: {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
      });
      return journalEntries;
    } catch (error) {
      throw new DatabaseError('Failed to list journal entries by date range', error);
    }
  }
}
