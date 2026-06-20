import prisma from '../../config/database';

/**
 * Report Scheduler Service
 * Manages scheduled report generation and delivery
 * 
 * Automates report generation on recurring schedules
 */

export interface ScheduledReport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  reportType: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'AGING_REPORT' | 'PROFITABILITY' | 'REVENUE_TREND' | 'COST_ANALYSIS' | 'MARGIN_ANALYSIS' | 'KPI_REPORT' | 'CUSTOM';
  scheduleType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  scheduleConfig: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    month?: number;
    time?: string;
    timezone?: string;
  };
  recipients: string[];
  format: 'PDF' | 'EXCEL' | 'CSV' | 'EMAIL';
  parameters?: Record<string, any>;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportExecution {
  id: string;
  scheduledReportId: string;
  tenantId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  reportUrl?: string;
  createdAt: Date;
}

export class ReportSchedulerService {
  /**
   * Create a scheduled report
   */
  async createScheduledReport(
    tenantId: string,
    name: string,
    description: string | undefined,
    reportType: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'AGING_REPORT' | 'PROFITABILITY' | 'REVENUE_TREND' | 'COST_ANALYSIS' | 'MARGIN_ANALYSIS' | 'KPI_REPORT' | 'CUSTOM',
    scheduleType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
    scheduleConfig: {
      dayOfWeek?: number;
      dayOfMonth?: number;
      month?: number;
      time?: string;
      timezone?: string;
    },
    recipients: string[],
    format: 'PDF' | 'EXCEL' | 'CSV' | 'EMAIL',
    parameters: Record<string, any> | undefined,
    createdBy: string
  ): Promise<ScheduledReport> {
    const nextRunAt = this.calculateNextRunTime(scheduleType, scheduleConfig);

    // In a real implementation, create in database
    return {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description,
      reportType,
      scheduleType,
      scheduleConfig,
      recipients,
      format,
      parameters,
      isActive: true,
      nextRunAt,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get scheduled report by ID
   */
  async getScheduledReport(id: string): Promise<ScheduledReport | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all scheduled reports for a tenant
   */
  async getScheduledReports(
    tenantId: string,
    isActive?: boolean
  ): Promise<ScheduledReport[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Update scheduled report
   */
  async updateScheduledReport(
    id: string,
    updates: {
      name?: string;
      description?: string;
      scheduleType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
      scheduleConfig?: {
        dayOfWeek?: number;
        dayOfMonth?: number;
        month?: number;
        time?: string;
        timezone?: string;
      };
      recipients?: string[];
      format?: 'PDF' | 'EXCEL' | 'CSV' | 'EMAIL';
      parameters?: Record<string, any>;
      isActive?: boolean;
      lastRunAt?: Date;
      nextRunAt?: Date;
    }
  ): Promise<ScheduledReport> {
    const scheduledReport = await this.getScheduledReport(id);
    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    const nextRunAt = updates.scheduleType || updates.scheduleConfig
      ? this.calculateNextRunTime(
          updates.scheduleType || scheduledReport.scheduleType,
          updates.scheduleConfig || scheduledReport.scheduleConfig
        )
      : scheduledReport.nextRunAt;

    return {
      ...scheduledReport,
      ...updates,
      nextRunAt,
      updatedAt: new Date()
    };
  }

  /**
   * Delete scheduled report
   */
  async deleteScheduledReport(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRunTime(
    scheduleType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
    scheduleConfig: {
      dayOfWeek?: number;
      dayOfMonth?: number;
      month?: number;
      time?: string;
      timezone?: string;
    }
  ): Date {
    const now = new Date();
    const nextRun = new Date(now);

    const time = scheduleConfig.time || '09:00';
    const [hours, minutes] = time.split(':').map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (scheduleType) {
      case 'DAILY':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'WEEKLY':
        const dayOfWeek = scheduleConfig.dayOfWeek || 1; // Monday
        const currentDay = nextRun.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7;
        if (daysUntil === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntil);
        }
        break;
      case 'MONTHLY':
        const dayOfMonth = scheduleConfig.dayOfMonth || 1;
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      case 'QUARTERLY':
        const month = scheduleConfig.month || 1;
        nextRun.setMonth(month - 1);
        nextRun.setDate(1);
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
      case 'YEARLY':
        nextRun.setMonth(0);
        nextRun.setDate(1);
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1);
        }
        break;
      case 'CUSTOM':
        // Custom schedules would need more complex logic
        break;
    }

    return nextRun;
  }

  /**
   * Execute a scheduled report
   */
  async executeScheduledReport(scheduledReportId: string): Promise<ReportExecution> {
    const scheduledReport = await this.getScheduledReport(scheduledReportId);
    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    const execution: ReportExecution = {
      id: crypto.randomUUID(),
      scheduledReportId,
      tenantId: scheduledReport.tenantId,
      status: 'RUNNING',
      startedAt: new Date(),
      createdAt: new Date()
    };

    // In a real implementation, generate the report here
    // For now, mark as completed
    execution.status = 'COMPLETED';
    execution.completedAt = new Date();
    execution.reportUrl = `/reports/${execution.id}.pdf`;

    // Update next run time
    const nextRunAt = this.calculateNextRunTime(scheduledReport.scheduleType, scheduledReport.scheduleConfig);
    await this.updateScheduledReport(scheduledReportId, {
      lastRunAt: new Date(),
      nextRunAt
    });

    return execution;
  }

  /**
   * Get report executions for a scheduled report
   */
  async getReportExecutions(
    scheduledReportId: string,
    limit: number = 10
  ): Promise<ReportExecution[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Get due reports (reports that need to run)
   */
  async getDueReports(): Promise<ScheduledReport[]> {
    const now = new Date();
    // In a real implementation, fetch from database where nextRunAt <= now and isActive = true
    return [];
  }

  /**
   * Run due reports
   */
  async runDueReports(): Promise<ReportExecution[]> {
    const dueReports = await this.getDueReports();

    const executions = await Promise.all(
      dueReports.map(report => this.executeScheduledReport(report.id))
    );

    return executions;
  }

  /**
   * Get scheduler summary for dashboard
   */
  async getSchedulerSummary(tenantId: string): Promise<{
    totalScheduledReports: number;
    activeScheduledReports: number;
    reportsRunToday: number;
    reportsRunThisWeek: number;
    nextScheduledRun: Date | null;
  }> {
    const scheduledReports = await this.getScheduledReports(tenantId);
    const activeScheduledReports = scheduledReports.filter(r => r.isActive).length;

    // In a real implementation, calculate actual counts
    const reportsRunToday = 0;
    const reportsRunThisWeek = 0;

    const nextScheduledRun = scheduledReports
      .filter(r => r.isActive && r.nextRunAt)
      .sort((a, b) => (a.nextRunAt!.getTime() - b.nextRunAt!.getTime()))[0]?.nextRunAt || null;

    return {
      totalScheduledReports: scheduledReports.length,
      activeScheduledReports,
      reportsRunToday,
      reportsRunThisWeek,
      nextScheduledRun
    };
  }
}

export default new ReportSchedulerService();
