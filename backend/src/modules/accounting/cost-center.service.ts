import prisma from '../../config/database';

/**
 * Cost Center Service
 * Manages cost centers for expense tracking and allocation
 * 
 * Cost centers help track expenses by department, project, or location
 */

export interface CostCenter {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  departmentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCenterExpense {
  costCenterId: string;
  costCenterName: string;
  totalExpensesSYP: number;
  totalExpensesUSD?: number;
  transactionCount: number;
  periodStart: Date;
  periodEnd: Date;
}

export class CostCenterService {
  /**
   * Create a new cost center
   */
  async createCostCenter(
    tenantId: string,
    code: string,
    name: string,
    nameAr: string | undefined,
    description: string | undefined,
    parentId?: string,
    managerId?: string,
    departmentId?: string
  ): Promise<CostCenter> {
    // In a real implementation, this would create a cost center in the database
    // For now, return a mock cost center
    return {
      id: crypto.randomUUID(),
      tenantId,
      code,
      name,
      nameAr,
      description,
      parentId,
      managerId,
      departmentId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get cost center by ID
   */
  async getCostCenter(id: string): Promise<CostCenter | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all cost centers for a tenant
   */
  async getCostCenters(
    tenantId: string,
    isActive?: boolean
  ): Promise<CostCenter[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Get cost center hierarchy
   */
  async getCostCenterHierarchy(tenantId: string): Promise<CostCenter[]> {
    const costCenters = await this.getCostCenters(tenantId);
    
    // Build hierarchy tree
    const hierarchy: CostCenter[] = [];
    const map = new Map<string, CostCenter & { children?: CostCenter[] }>();

    // First pass: create map
    for (const cc of costCenters) {
      map.set(cc.id, { ...cc, children: [] });
    }

    // Second pass: build hierarchy
    for (const cc of costCenters) {
      const node = map.get(cc.id)!;
      if (cc.parentId) {
        const parent = map.get(cc.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        hierarchy.push(node);
      }
    }

    return hierarchy;
  }

  /**
   * Update cost center
   */
  async updateCostCenter(
    id: string,
    updates: {
      code?: string;
      name?: string;
      nameAr?: string;
      description?: string;
      parentId?: string;
      managerId?: string;
      departmentId?: string;
      isActive?: boolean;
    }
  ): Promise<CostCenter> {
    const costCenter = await this.getCostCenter(id);
    if (!costCenter) {
      throw new Error('Cost center not found');
    }

    return {
      ...costCenter,
      ...updates,
      updatedAt: new Date()
    };
  }

  /**
   * Delete cost center
   */
  async deleteCostCenter(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Get expenses by cost center
   */
  async getCostCenterExpenses(
    tenantId: string,
    costCenterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostCenterExpense> {
    const costCenter = await this.getCostCenter(costCenterId);
    if (!costCenter) {
      throw new Error('Cost center not found');
    }

    // In a real implementation, calculate from journal entries
    return {
      costCenterId,
      costCenterName: costCenter.name,
      totalExpensesSYP: 0,
      totalExpensesUSD: 0,
      transactionCount: 0,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Get expenses for all cost centers
   */
  async getAllCostCenterExpenses(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostCenterExpense[]> {
    const costCenters = await this.getCostCenters(tenantId, true);

    return await Promise.all(
      costCenters.map(cc =>
        this.getCostCenterExpenses(tenantId, cc.id, startDate, endDate)
      )
    );
  }

  /**
   * Get cost center comparison
   */
  async getCostCenterComparison(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    costCenters: CostCenterExpense[];
    totalExpensesSYP: number;
    topExpenseCenter: CostCenterExpense | null;
  }> {
    const expenses = await this.getAllCostCenterExpenses(tenantId, startDate, endDate);
    const totalExpensesSYP = expenses.reduce((sum, e) => sum + e.totalExpensesSYP, 0);
    const topExpenseCenter = expenses.length > 0
      ? expenses.reduce((max, e) => e.totalExpensesSYP > max.totalExpensesSYP ? e : max)
      : null;

    return {
      costCenters: expenses,
      totalExpensesSYP,
      topExpenseCenter
    };
  }

  /**
   * Assign journal entry to cost center
   */
  async assignToCostCenter(
    journalLineId: string,
    costCenterId: string
  ): Promise<boolean> {
    // In a real implementation, update journal line with cost center
    return true;
  }

  /**
   * Get cost center summary for dashboard
   */
  async getCostCenterSummary(tenantId: string): Promise<{
    totalCostCenters: number;
    activeCostCenters: number;
    totalExpensesSYP: number;
    expenseByCostCenter: Array<{ name: string; amount: number }>;
  }> {
    const costCenters = await this.getCostCenters(tenantId);
    const activeCostCenters = costCenters.filter(cc => cc.isActive).length;

    return {
      totalCostCenters: costCenters.length,
      activeCostCenters,
      totalExpensesSYP: 0,
      expenseByCostCenter: []
    };
  }
}

export default new CostCenterService();
