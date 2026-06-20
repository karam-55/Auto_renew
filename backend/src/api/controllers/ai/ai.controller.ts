import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { AuthRequest } from '../../../shared/middlewares/auth';
import aiService from '../../../services/ai.service';

class AiController {
  /**
   * Process AI query
   */
  async processQuery(req: AuthRequest, res: Response) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      if (!req.user?.tenantId) {
        return res.status(400).json({ error: 'Tenant ID required' });
      }

      const userContext = {
        tenantId: req.user.tenantId,
        branchId: req.user.branchId,
        userId: req.user.id,
        role: req.user.role,
      };

      const response = await aiService.processQuery(query, userContext);
      res.json(response);
    } catch (error) {
      Logger.error('Error processing AI query:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
}

export default new AiController();
