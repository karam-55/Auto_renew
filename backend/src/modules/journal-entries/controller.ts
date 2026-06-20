import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { JournalEntryService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from './types';
import { CacheUtil } from '../../shared/utils/cache';

export class JournalEntryController {
  private journalEntryService: JournalEntryService;

  constructor() {
    this.journalEntryService = new JournalEntryService();
  }

  createJournalEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const data: CreateJournalEntryDto = req.body;

      const entry = await this.journalEntryService.createJournalEntry(tenantId, userId, data);

      // Invalidate journal entries cache
      await CacheUtil.delPattern(`journal-entries:${tenantId}:*`);

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      Logger.error('Create journal entry error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create journal entry',
      });
    }
  };

  getJournalEntries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        fiscalPeriodId: req.query.fiscalPeriodId as string,
        status: req.query.status as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        sourceType: req.query.sourceType as string,
        sourceId: req.query.sourceId as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      // Cache key based on filters
      const cacheKey = `journal-entries:${tenantId}:${JSON.stringify(filters)}`;

      // Try cache first (30 seconds TTL)
      const cached = await CacheUtil.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          cached: true,
        });
        return;
      }

      const entries = await this.journalEntryService.getJournalEntries(tenantId, filters);

      // Cache for 30 seconds
      await CacheUtil.set(cacheKey, entries, { ttl: 30 });

      res.status(200).json({
        success: true,
        data: entries,
      });
    } catch (error) {
      Logger.error('Get journal entries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get journal entries',
      });
    }
  };

  getJournalEntryById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const entry = await this.journalEntryService.getJournalEntryById(tenantId, id);

      if (!entry) {
        res.status(404).json({
          success: false,
          error: 'Journal entry not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      Logger.error('Get journal entry by ID error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get journal entry',
      });
    }
  };

  updateJournalEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateJournalEntryDto = req.body;

      const entry = await this.journalEntryService.updateJournalEntry(tenantId, id, data);

      // Invalidate journal entries cache
      await CacheUtil.delPattern(`journal-entries:${tenantId}:*`);

      res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      Logger.error('Update journal entry error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update journal entry',
      });
    }
  };

  deleteJournalEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.journalEntryService.deleteJournalEntry(tenantId, id);

      // Invalidate journal entries cache
      await CacheUtil.delPattern(`journal-entries:${tenantId}:*`);

      res.status(200).json({
        success: true,
        message: 'Journal entry deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete journal entry error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete journal entry',
      });
    }
  };

  getJournalEntrySummaries = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        fiscalPeriodId: req.query.fiscalPeriodId as string,
        status: req.query.status as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const summaries = await this.journalEntryService.getJournalEntrySummaries(tenantId, filters);

      res.status(200).json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      Logger.error('Get journal entry summaries error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get journal entry summaries',
      });
    }
  };
}