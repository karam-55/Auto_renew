import { Request, Response } from 'express';
import { AuthRequest } from '../../shared/middlewares/auth';
import { GeneralLedgerService } from './service';
import { Logger } from '../../infrastructure/logging/logger';

export class GeneralLedgerController {
  private generalLedgerService: GeneralLedgerService;

  constructor() {
    this.generalLedgerService = new GeneralLedgerService();
  }

  getGeneralLedger = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.tenantId;
      const filters = {
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        accountId: req.query.accountId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const report = await this.generalLedgerService.generateGeneralLedger(tenantId, filters);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      Logger.error('Get general ledger error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate general ledger',
      });
    }
  };
}
