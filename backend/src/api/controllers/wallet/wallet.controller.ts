import { Request, Response } from 'express';
import { WalletService } from '../../../modules/wallet/wallet.service';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  async getWallet(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const wallet = await this.walletService.getWallet(customerId, tenantId);
      
      res.json({ success: true, data: wallet });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async addBalance(req: Request, res: Response) {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const customerId = req.params.id;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID required' });
      }

      const wallet = await this.walletService.addBalance({
        tenantId,
        customerId,
        amount: req.body.amount,
      });
      
      res.json({ success: true, data: wallet });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
