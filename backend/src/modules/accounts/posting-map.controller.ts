import { Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { Logger } from '../../infrastructure/logging/logger';
import { postingMapService } from './posting-map.service';

export class PostingMapController {
  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const mappings = await postingMapService.getAll(tenantId);
      res.json({ success: true, data: mappings });
    } catch (error: any) {
      Logger.error('Get account posting maps error:', error);
      res.status(500).json({ success: false, message: 'Failed to load account mappings' });
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const { mappingKey } = req.params;
      const { accountId } = req.body;
      if (!accountId || typeof accountId !== 'string') {
        res.status(400).json({ success: false, message: 'Choose an account' });
        return;
      }

      const mapping = await postingMapService.setAccount(tenantId, mappingKey, accountId);
      res.json({ success: true, data: mapping });
    } catch (error: any) {
      Logger.error('Update account posting map error:', error);
      const message = error.message || 'Failed to update account mapping';
      const status = ['Unknown account mapping role', 'Account not found or inactive', 'Posting must use a leaf account, not a parent']
        .includes(message) || message.startsWith('Selected account must be of type')
        ? 400
        : 500;
      res.status(status).json({ success: false, message });
    }
  };
}

export const postingMapController = new PostingMapController();
