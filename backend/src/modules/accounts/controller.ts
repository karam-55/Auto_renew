import { Request, Response } from 'express';
import { AccountService } from './service';
import { AuthRequest, authorize } from '../../shared/middlewares/auth';
import { CreateAccountDto, UpdateAccountDto } from './types';
import { AccountType } from '@prisma/client';
import { Logger } from '../../infrastructure/logging/logger';

export class AccountController {
  private accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const data: CreateAccountDto = req.body;

      const account = await this.accountService.createAccount(tenantId, data);

      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error) {
      Logger.error('Create account error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create account',
      });
    }
  };

  getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        accountType: req.query.accountType as AccountType | undefined,
        parentId: req.query.parentId as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string,
      };

      const accounts = await this.accountService.getAccounts(tenantId, filters);

      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      Logger.error('Get accounts error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get accounts',
      });
    }
  };

  getAccountById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const account = await this.accountService.getAccountById(tenantId, id);

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      Logger.error('Get account by ID error', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account',
      });
    }
  };

  updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const data: UpdateAccountDto = req.body;

      const account = await this.accountService.updateAccount(tenantId, id, data);

      res.status(200).json({
        success: true,
        data: account,
      });
    } catch (error) {
      Logger.error('Update account error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update account',
      });
    }
  };

  deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      await this.accountService.deleteAccount(tenantId, id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      Logger.error('Delete account error', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete account',
      });
    }
  };

  getAccountTree = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const tree = await this.accountService.getAccountTree(tenantId);

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      Logger.error('Get account tree error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account tree',
      });
    }
  };

  getAccountBalances = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;

      const balances = await this.accountService.getAccountBalances(tenantId);

      res.status(200).json({
        success: true,
        data: balances,
      });
    } catch (error) {
      Logger.error('Get account balances error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account balances',
      });
    }
  };
}