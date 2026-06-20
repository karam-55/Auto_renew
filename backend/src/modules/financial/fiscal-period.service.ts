import prisma from '../../config/database';

/**
 * Fiscal Period Service
 * Manages fiscal periods (monthly, quarterly, yearly) with close/reopen functionality
 * 
 * Fiscal periods define accounting periods for financial reporting
 */

export interface FiscalPeriodInfo {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FiscalPeriodService {
  /**
   * Create a new fiscal period
   */
  async createFiscalPeriod(
    tenantId: string,
    name: string,
    startDate: Date,
    endDate: Date
  ): Promise<FiscalPeriodInfo> {
    const fiscalPeriod = await prisma.fiscalPeriod.create({
      data: {
        tenantId,
        name,
        startDate,
        endDate,
        isClosed: false,
        status: 'ACTIVE'
      }
    });

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Get fiscal period by ID
   */
  async getFiscalPeriod(id: string): Promise<FiscalPeriodInfo | null> {
    const fiscalPeriod = await prisma.fiscalPeriod.findUnique({
      where: { id }
    });

    if (!fiscalPeriod) {
      return null;
    }

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Get all fiscal periods for a tenant
   */
  async getFiscalPeriods(
    tenantId: string,
    isClosed?: boolean
  ): Promise<FiscalPeriodInfo[]> {
    const where: any = {
      tenantId
    };

    if (isClosed !== undefined) {
      where.isClosed = isClosed;
    }

    const fiscalPeriods = await prisma.fiscalPeriod.findMany({
      where,
      orderBy: {
        startDate: 'desc'
      }
    });

    return fiscalPeriods.map(fp => ({
      id: fp.id,
      tenantId: fp.tenantId,
      name: fp.name,
      startDate: fp.startDate,
      endDate: fp.endDate,
      isClosed: fp.isClosed,
      status: fp.status,
      createdAt: fp.createdAt,
      updatedAt: fp.updatedAt
    }));
  }

  /**
   * Get current open fiscal period
   */
  async getCurrentFiscalPeriod(tenantId: string): Promise<FiscalPeriodInfo | null> {
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        isClosed: false,
        startDate: {
          lte: new Date()
        },
        endDate: {
          gte: new Date()
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    if (!fiscalPeriod) {
      return null;
    }

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Close a fiscal period
   */
  async closeFiscalPeriod(id: string): Promise<FiscalPeriodInfo> {
    const fiscalPeriod = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        isClosed: true,
        status: 'CLOSED'
      }
    });

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Reopen a closed fiscal period
   */
  async reopenFiscalPeriod(id: string): Promise<FiscalPeriodInfo> {
    const fiscalPeriod = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        isClosed: false,
        status: 'ACTIVE'
      }
    });

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Lock a fiscal period (permanent - cannot be reopened)
   */
  async lockFiscalPeriod(id: string): Promise<FiscalPeriodInfo> {
    const fiscalPeriod = await prisma.fiscalPeriod.update({
      where: { id },
      data: {
        isClosed: true,
        status: 'CLOSED'
      }
    });

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Auto-generate fiscal periods for a year
   */
  async generateYearlyPeriods(
    tenantId: string,
    year: number
  ): Promise<FiscalPeriodInfo[]> {
    const periods: FiscalPeriodInfo[] = [];

    // Generate 12 monthly periods
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      const period = await this.createFiscalPeriod(
        tenantId,
        `${year}-${month.toString().padStart(2, '0')}`,
        startDate,
        endDate
      );

      periods.push(period);
    }

    // Generate 4 quarterly periods
    const quarters = [
      { q: 1, startMonth: 1, endMonth: 3 },
      { q: 2, startMonth: 4, endMonth: 6 },
      { q: 3, startMonth: 7, endMonth: 9 },
      { q: 4, startMonth: 10, endMonth: 12 }
    ];

    for (const quarter of quarters) {
      const startDate = new Date(year, quarter.startMonth - 1, 1);
      const endDate = new Date(year, quarter.endMonth, 0);

      const period = await this.createFiscalPeriod(
        tenantId,
        `Q${quarter.q} ${year}`,
        startDate,
        endDate
      );

      periods.push(period);
    }

    // Generate yearly period
    const yearStartDate = new Date(year, 0, 1);
    const yearEndDate = new Date(year, 11, 31);

    const yearPeriod = await this.createFiscalPeriod(
      tenantId,
      `Year ${year}`,
      yearStartDate,
      yearEndDate
    );

    periods.push(yearPeriod);

    return periods;
  }

  /**
   * Get fiscal period for a specific date
   */
  async getFiscalPeriodForDate(
    tenantId: string,
    date: Date
  ): Promise<FiscalPeriodInfo | null> {
    const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        startDate: {
          lte: date
        },
        endDate: {
          gte: date
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    if (!fiscalPeriod) {
      return null;
    }

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Update fiscal period
   */
  async updateFiscalPeriod(
    id: string,
    updates: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<FiscalPeriodInfo> {
    const fiscalPeriod = await prisma.fiscalPeriod.update({
      where: { id },
      data: updates
    });

    return {
      id: fiscalPeriod.id,
      tenantId: fiscalPeriod.tenantId,
      name: fiscalPeriod.name,
      startDate: fiscalPeriod.startDate,
      endDate: fiscalPeriod.endDate,
      isClosed: fiscalPeriod.isClosed,
      status: fiscalPeriod.status,
      createdAt: fiscalPeriod.createdAt,
      updatedAt: fiscalPeriod.updatedAt
    };
  }

  /**
   * Delete fiscal period (only if not closed)
   */
  async deleteFiscalPeriod(id: string): Promise<boolean> {
    const fiscalPeriod = await prisma.fiscalPeriod.findUnique({
      where: { id }
    });

    if (!fiscalPeriod) {
      return false;
    }

    if (fiscalPeriod.isClosed) {
      throw new Error('Cannot delete a closed fiscal period');
    }

    await prisma.fiscalPeriod.delete({
      where: { id }
    });

    return true;
  }
}

export default new FiscalPeriodService();
