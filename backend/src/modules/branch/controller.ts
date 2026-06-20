import { Request, Response } from 'express';
import { Logger } from '../../infrastructure/logging/logger';
import { BranchService } from './branch.service';
import { AuthRequest } from '../../shared/middlewares/auth';

export class BranchController {
  private branchService: BranchService;

  constructor() {
    this.branchService = new BranchService();
  }

  getBranches = async (req: AuthRequest, res: Response) => {
    try {
      const branches = await this.branchService.getAllBranches(req.user!.tenantId);
      res.json({ branches });
    } catch (error) {
      Logger.error('Get branches error:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  };

  getBranchById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.getBranchById(id, req.user!.tenantId);

      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      res.json({ branch });
    } catch (error) {
      Logger.error('Get branch error:', error);
      res.status(500).json({ error: 'Failed to fetch branch' });
    }
  };

  createBranch = async (req: AuthRequest, res: Response) => {
    try {
      const branch = await this.branchService.createBranch({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      res.status(201).json({ branch });
    } catch (error: any) {
      Logger.error('Create branch error:', error);
      res.status(400).json({ error: error.message || 'Failed to create branch' });
    }
  };

  updateBranch = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.updateBranch(id, req.user!.tenantId, req.body);
      res.json({ branch });
    } catch (error: any) {
      Logger.error('Update branch error:', error);
      res.status(400).json({ error: error.message || 'Failed to update branch' });
    }
  };

  deleteBranch = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.deleteBranch(id, req.user!.tenantId);
      res.json({ branch });
    } catch (error: any) {
      Logger.error('Delete branch error:', error);
      res.status(400).json({ error: error.message || 'Failed to delete branch' });
    }
  };

  activateBranch = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.activateBranch(id, req.user!.tenantId);
      res.json({ branch });
    } catch (error: any) {
      Logger.error('Activate branch error:', error);
      res.status(400).json({ error: error.message || 'Failed to activate branch' });
    }
  };

  deactivateBranch = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const branch = await this.branchService.deactivateBranch(id, req.user!.tenantId);
      res.json({ branch });
    } catch (error: any) {
      Logger.error('Deactivate branch error:', error);
      res.status(400).json({ error: error.message || 'Failed to deactivate branch' });
    }
  };
}
