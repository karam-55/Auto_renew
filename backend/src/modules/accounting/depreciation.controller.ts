import { Request, Response } from 'express';
import { createDepreciationJournalEntries } from './automatic-journal-entries';
import { DepreciationCron } from './depreciation.cron';

export class DepreciationController {
  private cron = new DepreciationCron();

  /**
   * Run depreciation for current tenant (manual trigger)
   */
  async runDepreciation(req: any, res: Response) {
    try {
      const tenantId = req.user?.tenantId || req.body.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID required' });
        return;
      }

      const result = await createDepreciationJournalEntries(tenantId, new Date());
      res.json({
        success: true,
        data: result,
        message: `Created ${result.created} depreciation entries with total ${result.totalAmount} SYP`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Run depreciation for all tenants (admin only)
   */
  async runAllDepreciation(req: any, res: Response) {
    try {
      const results = await this.cron.runMonthlyDepreciation();
      res.json({
        success: true,
        data: results,
        message: 'Monthly depreciation completed for all tenants'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
