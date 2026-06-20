import { Request, Response } from 'express';
import { MembershipService } from '../../../modules/membership/membership.service';

export class MembershipPlansController {
  private membershipService: MembershipService;

  constructor() {
    this.membershipService = new MembershipService();
  }

  async getAllPlans(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const plans = await this.membershipService.getAllPlans(tenantId);
      
      res.json({ success: true, data: plans });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createPlan(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const plan = await this.membershipService.createPlan({
        tenantId,
        name: req.body.name,
        nameAr: req.body.nameAr,
        nameEn: req.body.nameEn,
        description: req.body.description,
        descriptionAr: req.body.descriptionAr,
        descriptionEn: req.body.descriptionEn,
        price: req.body.price,
        durationDays: req.body.durationDays,
        includedServices: req.body.includedServices || [],
        includedVisits: req.body.includedVisits,
        discountPercentage: req.body.discountPercentage,
      });
      
      res.status(201).json({ success: true, data: plan });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updatePlan(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const planId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const plan = await this.membershipService.updatePlan(planId, tenantId, {
        name: req.body.name,
        nameAr: req.body.nameAr,
        nameEn: req.body.nameEn,
        description: req.body.description,
        descriptionAr: req.body.descriptionAr,
        descriptionEn: req.body.descriptionEn,
        price: req.body.price,
        durationDays: req.body.durationDays,
        includedServices: req.body.includedServices,
        includedVisits: req.body.includedVisits,
        discountPercentage: req.body.discountPercentage,
        isActive: req.body.isActive,
      });
      
      res.json({ success: true, data: plan });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deletePlan(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const planId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      await this.membershipService.deletePlan(planId, tenantId);
      
      res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
