import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { BranchService } from '../../../modules/branch/branch.service';
import prisma from '../../../config/database';

const branchService = new BranchService();

export class BranchesController {
  async getAllBranches(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branches = await branchService.getAllBranches(tenantId);
      res.json({ success: true, data: branches });
    } catch (error) {
      Logger.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  }

  async getBranchById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branch = await branchService.getBranchById(id, tenantId);
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found' });
      }

      res.json({ success: true, data: branch });
    } catch (error) {
      Logger.error('Error fetching branch:', error);
      res.status(500).json({ error: 'Failed to fetch branch' });
    }
  }

  async createBranch(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branchData = {
        ...req.body,
        tenantId,
      };

      const branch = await branchService.createBranch(branchData);
      res.status(201).json({ success: true, data: branch });
    } catch (error) {
      Logger.error('Error creating branch:', error);
      res.status(500).json({ error: 'Failed to create branch' });
    }
  }

  async updateBranch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branch = await branchService.updateBranch(id, tenantId, req.body);
      res.json({ success: true, data: branch });
    } catch (error) {
      Logger.error('Error updating branch:', error);
      res.status(500).json({ error: 'Failed to update branch' });
    }
  }

  async deleteBranch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branch = await branchService.deleteBranch(id, tenantId);
      res.json({ success: true, data: branch });
    } catch (error: any) {
      Logger.error('Error deleting branch:', error);
      res.status(400).json({ error: error.message || 'Failed to delete branch' });
    }
  }

  async activateBranch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branch = await branchService.activateBranch(id, tenantId);
      res.json({ success: true, data: branch });
    } catch (error) {
      Logger.error('Error activating branch:', error);
      res.status(500).json({ error: 'Failed to activate branch' });
    }
  }

  async deactivateBranch(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const branch = await branchService.deactivateBranch(id, tenantId);
      res.json({ success: true, data: branch });
    } catch (error) {
      Logger.error('Error deactivating branch:', error);
      res.status(500).json({ error: 'Failed to deactivate branch' });
    }
  }

  // Batch create branches
  async createMany(req: Request, res: Response) {
    try {
      const tenantId = req.branchContext?.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const { branches } = req.body;
      if (!Array.isArray(branches) || branches.length === 0) {
        return res.status(400).json({ error: 'Branches array is required' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const branch of branches) {
          const b = await tx.branch.create({
            data: {
              tenantId,
              name: branch.name,
              nameAr: branch.nameAr || branch.name,
              nameEn: branch.nameEn || branch.name,
              address: branch.address || '',
              phone: branch.phone || '',
              isActive: branch.isActive !== undefined ? branch.isActive : true,
            },
          });
          created.push(b);
        }
        return created;
      }, {
        timeout: 30000,
      });

      res.status(201).json({ success: true, count: result.length, data: result });
    } catch (error) {
      Logger.error('Batch create branches error:', error);
      res.status(500).json({ error: 'Failed to create branches' });
    }
  }
}
