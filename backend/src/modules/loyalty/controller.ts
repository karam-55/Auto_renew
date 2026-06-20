import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { LoyaltyService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import {
  CreateRewardInput,
  UpdateRewardInput,
  AddPointsInput,
  LoyaltyFilters,
  PaginationParams,
} from './types';

export class LoyaltyController {
  private loyaltyService: LoyaltyService;

  constructor() {
    this.loyaltyService = new LoyaltyService();
  }

  setIo(io: any) {
    this.loyaltyService.setIo(io);
  }

  // ============================================
  // LOYALTY POINTS ENDPOINTS
  // ============================================

  addPoints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: AddPointsInput = req.body;

      const point = await this.loyaltyService.addPoints(tenantId, data);

      res.status(201).json({
        success: true,
        data: point,
      });
    } catch (error) {
      Logger.error('Add loyalty points error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add loyalty points',
      });
    }
  };

  getLoyaltyPoints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters: LoyaltyFilters = {
        customerId: req.query.customerId as string,
        invoiceId: req.query.invoiceId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };
      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const points = await this.loyaltyService.getLoyaltyPoints(tenantId, filters, pagination);

      res.status(200).json({
        success: true,
        data: points.data,
        pagination: points.pagination,
      });
    } catch (error) {
      Logger.error('Get loyalty points error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get loyalty points',
      });
    }
  };

  // ============================================
  // LOYALTY REWARDS ENDPOINTS
  // ============================================

  createReward = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: CreateRewardInput = req.body;

      const reward = await this.loyaltyService.createReward(tenantId, data);

      res.status(201).json({
        success: true,
        data: reward,
      });
    } catch (error) {
      Logger.error('Create loyalty reward error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create loyalty reward',
      });
    }
  };

  getRewards = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const pagination: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const rewards = await this.loyaltyService.getRewards(tenantId, pagination);

      res.status(200).json({
        success: true,
        data: rewards.data,
        pagination: rewards.pagination,
      });
    } catch (error) {
      Logger.error('Get loyalty rewards error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get loyalty rewards',
      });
    }
  };

  getRewardById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const reward = await this.loyaltyService.getRewardById(tenantId, id);

      res.status(200).json({
        success: true,
        data: reward,
      });
    } catch (error) {
      Logger.error('Get loyalty reward by ID error:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Reward not found',
      });
    }
  };

  updateReward = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateRewardInput = req.body;

      const reward = await this.loyaltyService.updateReward(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: reward,
      });
    } catch (error) {
      Logger.error('Update loyalty reward error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update loyalty reward',
      });
    }
  };

  deleteReward = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.loyaltyService.deleteReward(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Reward deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete loyalty reward error:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Reward not found',
      });
    }
  };

  // ============================================
  // CUSTOMER LOYALTY SUMMARY ENDPOINT
  // ============================================

  getCustomerLoyaltySummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { customerId } = req.params;

      const summary = await this.loyaltyService.getCustomerLoyaltySummary(tenantId, customerId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      Logger.error('Get customer loyalty summary error:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Customer not found',
      });
    }
  };
}