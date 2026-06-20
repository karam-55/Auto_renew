import { createDepreciationJournalEntries } from './automatic-journal-entries';
import { Logger } from '../../infrastructure/logging/logger';
import prisma from '../../config/database';

/**
 * Depreciation Cron Job
 * Handles monthly depreciation journal entries
 */
export class DepreciationCron {
  /**
   * Run monthly depreciation for all tenants
   */
  async runMonthlyDepreciation() {
    Logger.debug('Running monthly depreciation...');

    const tenants = await prisma.tenant.findMany({ where: { isActive: true } });
    const results: any[] = [];

    for (const tenant of tenants) {
      try {
        const result = await createDepreciationJournalEntries(tenant.id, new Date());
        Logger.info(`Tenant ${tenant.name}: ${result.created} depreciation entries created, total: ${result.totalAmount}`);
        results.push({ tenantId: tenant.id, ...result });
      } catch (error: any) {
        Logger.error(`Failed to create depreciation for tenant ${tenant.id}: ${error.message}`);
        results.push({ tenantId: tenant.id, error: error.message });
      }
    }

    return results;
  }

  /**
   * Schedule monthly depreciation (last day of month at 11:59 PM)
   */
  startMonthlySchedule() {
    // This would be called by the main cron scheduler
    Logger.debug('Depreciation cron job scheduled - run monthly at end of month');
  }
}
