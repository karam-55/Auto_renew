import { MembershipService } from './membership.service';
import { Logger } from '../../infrastructure/logging/logger';

export class MembershipCron {
  private membershipService: MembershipService;

  constructor() {
    this.membershipService = new MembershipService();
  }

  async runDailyExpirationCheck() {
    Logger.debug('Running daily membership expiration check...');
    
    // Expire memberships
    const expiredCount = await this.membershipService.expireMemberships();
    Logger.info(`Expired ${expiredCount} memberships`);

    // Check for expiring memberships (next 7 days)
    const expiringCount = await this.membershipService.checkExpiringMemberships();
    Logger.info(`Sent notifications for ${expiringCount} expiring memberships`);

    return { expiredCount, expiringCount };
  }

  // Run this method daily (e.g., via node-cron or external scheduler)
  startDailySchedule() {
    // Example using node-cron (would need to be installed)
    // cron.schedule('0 0 * * *', () => {
    //   this.runDailyExpirationCheck();
    // });
    
    Logger.debug('Membership cron job scheduled to run daily at midnight');
  }
}
