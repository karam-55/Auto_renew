import { Request, Response } from 'express';
import { MembershipService } from '../../../modules/membership/membership.service';
import { logAuditFromRequest } from '../../../middleware/audit.middleware';

export class CustomerMembershipsController {
  private membershipService: MembershipService;

  constructor() {
    this.membershipService = new MembershipService();
  }

  async getCustomerMemberships(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const memberships = await this.membershipService.getCustomerMemberships(customerId, tenantId);
      
      res.json({ success: true, data: memberships });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async purchaseMembership(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const membership = await this.membershipService.purchaseMembership({
        tenantId,
        customerId,
        membershipPlanId: req.body.membershipPlanId,
      });
      
      // Log membership purchase
      logAuditFromRequest(req, 'MEMBERSHIP_PURCHASED', 'CustomerMembership', membership.id, null, membership);
      
      res.status(201).json({ success: true, data: membership });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async cancelMembership(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const membershipId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const membership = await this.membershipService.cancelMembership(membershipId, tenantId);
      
      // Log membership cancellation
      logAuditFromRequest(req, 'MEMBERSHIP_CANCELLED', 'CustomerMembership', membershipId, null, membership);
      
      res.json({ success: true, data: membership });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
