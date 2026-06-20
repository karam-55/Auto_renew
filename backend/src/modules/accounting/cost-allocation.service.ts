import prisma from '../../config/database';

/**
 * Cost Allocation Service
 * Manages cost allocation rules for distributing expenses
 * 
 * Cost allocation rules define how shared expenses are distributed across cost centers
 */

export interface AllocationRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sourceAccountId: string;
  sourceAccountName: string;
  allocationMethod: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'HEAD_COUNT' | 'REVENUE_BASED';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AllocationTarget {
  id: string;
  allocationRuleId: string;
  costCenterId: string;
  costCenterName: string;
  percentage?: number;
  fixedAmount?: number;
  priority: number;
}

export interface AllocationResult {
  allocationRuleId: string;
  ruleName: string;
  totalAmountSYP: number;
  allocations: Array<{
    costCenterId: string;
    costCenterName: string;
    allocatedAmountSYP: number;
    percentage: number;
  }>;
  allocatedAt: Date;
}

export class CostAllocationService {
  /**
   * Create a new allocation rule
   */
  async createAllocationRule(
    tenantId: string,
    name: string,
    description: string | undefined,
    sourceAccountId: string,
    allocationMethod: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'HEAD_COUNT' | 'REVENUE_BASED'
  ): Promise<AllocationRule> {
    // Get source account details
    const account = await prisma.account.findUnique({
      where: { id: sourceAccountId }
    });

    if (!account) {
      throw new Error('Source account not found');
    }

    // In a real implementation, create in database
    return {
      id: crypto.randomUUID(),
      tenantId,
      name,
      description,
      sourceAccountId,
      sourceAccountName: account.nameEn || account.nameAr,
      allocationMethod,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get allocation rule by ID
   */
  async getAllocationRule(id: string): Promise<AllocationRule | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all allocation rules for a tenant
   */
  async getAllocationRules(
    tenantId: string,
    isActive?: boolean
  ): Promise<AllocationRule[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Add allocation target to a rule
   */
  async addAllocationTarget(
    allocationRuleId: string,
    costCenterId: string,
    percentage?: number,
    fixedAmount?: number,
    priority: number = 0
  ): Promise<AllocationTarget> {
    // Get cost center details
    // In a real implementation, fetch from database
    return {
      id: crypto.randomUUID(),
      allocationRuleId,
      costCenterId,
      costCenterName: 'Cost Center',
      percentage,
      fixedAmount,
      priority
    };
  }

  /**
   * Execute allocation for a specific rule
   */
  async executeAllocation(
    allocationRuleId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AllocationResult> {
    const rule = await this.getAllocationRule(allocationRuleId);
    if (!rule) {
      throw new Error('Allocation rule not found');
    }

    // Calculate total amount from source account
    const totalAmountSYP = await this.calculateSourceAmount(
      rule.sourceAccountId,
      periodStart,
      periodEnd
    );

    // Get allocation targets
    const targets: AllocationTarget[] = []; // Fetch from database

    // Calculate allocations based on method
    const allocations = await this.calculateAllocations(
      rule,
      targets,
      totalAmountSYP
    );

    return {
      allocationRuleId: rule.id,
      ruleName: rule.name,
      totalAmountSYP,
      allocations,
      allocatedAt: new Date()
    };
  }

  /**
   * Calculate source amount from account
   */
  private async calculateSourceAmount(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const journalLines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          entryDate: {
            gte: startDate,
            lte: endDate
          },
          status: 'POSTED'
        }
      }
    });

    let totalSYP = 0;
    for (const line of journalLines) {
      totalSYP += Number(line.debitSYP || 0) - Number(line.creditSYP || 0);
    }

    return Math.abs(totalSYP);
  }

  /**
   * Calculate allocations based on method
   */
  private async calculateAllocations(
    rule: AllocationRule,
    targets: AllocationTarget[],
    totalAmountSYP: number
  ): Promise<Array<{
    costCenterId: string;
    costCenterName: string;
    allocatedAmountSYP: number;
    percentage: number;
  }>> {
    const allocations: Array<{
      costCenterId: string;
      costCenterName: string;
      allocatedAmountSYP: number;
      percentage: number;
    }> = [];

    switch (rule.allocationMethod) {
      case 'PERCENTAGE':
        for (const target of targets) {
          if (target.percentage) {
            const allocatedAmountSYP = (totalAmountSYP * target.percentage) / 100;
            allocations.push({
              costCenterId: target.costCenterId,
              costCenterName: target.costCenterName,
              allocatedAmountSYP,
              percentage: target.percentage
            });
          }
        }
        break;

      case 'FIXED_AMOUNT':
        for (const target of targets) {
          if (target.fixedAmount) {
            const percentage = (target.fixedAmount / totalAmountSYP) * 100;
            allocations.push({
              costCenterId: target.costCenterId,
              costCenterName: target.costCenterName,
              allocatedAmountSYP: target.fixedAmount,
              percentage
            });
          }
        }
        break;

      case 'HEAD_COUNT':
        // In a real implementation, calculate based on employee count
        break;

      case 'REVENUE_BASED':
        // In a real implementation, calculate based on revenue
        break;
    }

    return allocations;
  }

  /**
   * Execute all active allocation rules
   */
  async executeAllAllocations(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AllocationResult[]> {
    const rules = await this.getAllocationRules(tenantId, true);

    return await Promise.all(
      rules.map(rule => this.executeAllocation(rule.id, periodStart, periodEnd))
    );
  }

  /**
   * Update allocation rule
   */
  async updateAllocationRule(
    id: string,
    updates: {
      name?: string;
      description?: string;
      sourceAccountId?: string;
      allocationMethod?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'HEAD_COUNT' | 'REVENUE_BASED';
      isActive?: boolean;
    }
  ): Promise<AllocationRule> {
    const rule = await this.getAllocationRule(id);
    if (!rule) {
      throw new Error('Allocation rule not found');
    }

    return {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };
  }

  /**
   * Delete allocation rule
   */
  async deleteAllocationRule(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Get allocation history
   */
  async getAllocationHistory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AllocationResult[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Get allocation summary
   */
  async getAllocationSummary(tenantId: string): Promise<{
    totalRules: number;
    activeRules: number;
    totalAllocatedSYP: number;
    allocationByMethod: Record<string, number>;
  }> {
    const rules = await this.getAllocationRules(tenantId);
    const activeRules = rules.filter(r => r.isActive).length;

    return {
      totalRules: rules.length,
      activeRules,
      totalAllocatedSYP: 0,
      allocationByMethod: {}
    };
  }
}

export default new CostAllocationService();
