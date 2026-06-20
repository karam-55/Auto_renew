import prisma from '../../config/database';

/**
 * KPI Definitions Service
 * Manages Key Performance Indicator definitions and metadata
 * 
 * KPIs help track business performance across various dimensions
 */

export interface KPIDefinition {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  category: 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE' | 'SERVICE';
  dataType: 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'COUNT' | 'RATING';
  unit?: string;
  formula?: string;
  targetValue?: number;
  targetOperator?: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'BETWEEN';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIValue {
  id: string;
  kpiDefinitionId: string;
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  targetValue?: number;
  variance?: number;
  variancePercent?: number;
  status: 'ON_TARGET' | 'BELOW_TARGET' | 'ABOVE_TARGET';
  calculatedAt: Date;
}

export class KPIDefinitionsService {
  /**
   * Create a new KPI definition
   */
  async createKPIDefinition(
    tenantId: string,
    code: string,
    name: string,
    nameAr: string | undefined,
    description: string | undefined,
    category: 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE' | 'SERVICE',
    dataType: 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'COUNT' | 'RATING',
    unit: string | undefined,
    formula: string | undefined,
    targetValue: number | undefined,
    targetOperator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'BETWEEN' | undefined,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  ): Promise<KPIDefinition> {
    // In a real implementation, create in database
    return {
      id: crypto.randomUUID(),
      tenantId,
      code,
      name,
      nameAr,
      description,
      category,
      dataType,
      unit,
      formula,
      targetValue,
      targetOperator,
      frequency,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get KPI definition by ID
   */
  async getKPIDefinition(id: string): Promise<KPIDefinition | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all KPI definitions for a tenant
   */
  async getKPIDefinitions(
    tenantId: string,
    category?: 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE' | 'SERVICE',
    isActive?: boolean
  ): Promise<KPIDefinition[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Update KPI definition
   */
  async updateKPIDefinition(
    id: string,
    updates: {
      code?: string;
      name?: string;
      nameAr?: string;
      description?: string;
      category?: 'FINANCIAL' | 'OPERATIONAL' | 'CUSTOMER' | 'EMPLOYEE' | 'SERVICE';
      dataType?: 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'COUNT' | 'RATING';
      unit?: string;
      formula?: string;
      targetValue?: number;
      targetOperator?: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO' | 'BETWEEN';
      frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      isActive?: boolean;
    }
  ): Promise<KPIDefinition> {
    const kpiDefinition = await this.getKPIDefinition(id);
    if (!kpiDefinition) {
      throw new Error('KPI definition not found');
    }

    return {
      ...kpiDefinition,
      ...updates,
      updatedAt: new Date()
    };
  }

  /**
   * Delete KPI definition
   */
  async deleteKPIDefinition(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Get predefined KPI templates
   */
  async getKPITemplates(): Promise<KPIDefinition[]> {
    // Return common KPI templates
    return [
      {
        id: 'template-1',
        tenantId: '',
        code: 'TOTAL_REVENUE',
        name: 'Total Revenue',
        nameAr: 'إجمالي الإيرادات',
        description: 'Total revenue generated in the period',
        category: 'FINANCIAL',
        dataType: 'CURRENCY',
        unit: 'SYP',
        formula: 'SUM(invoice.totalSYP)',
        targetValue: 10000000,
        targetOperator: 'GREATER_THAN',
        frequency: 'MONTHLY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'template-2',
        tenantId: '',
        code: 'GROSS_MARGIN',
        name: 'Gross Margin',
        nameAr: 'هامش الربح الإجمالي',
        description: 'Gross margin percentage',
        category: 'FINANCIAL',
        dataType: 'PERCENTAGE',
        unit: '%',
        formula: '(revenue - cost) / revenue * 100',
        targetValue: 30,
        targetOperator: 'GREATER_THAN',
        frequency: 'MONTHLY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'template-3',
        tenantId: '',
        code: 'CUSTOMER_SATISFACTION',
        name: 'Customer Satisfaction',
        nameAr: 'رضا العملاء',
        description: 'Average customer satisfaction rating',
        category: 'CUSTOMER',
        dataType: 'RATING',
        unit: '1-5',
        formula: 'AVG(customer.rating)',
        targetValue: 4,
        targetOperator: 'GREATER_THAN',
        frequency: 'MONTHLY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'template-4',
        tenantId: '',
        code: 'JOB_COMPLETION_RATE',
        name: 'Job Completion Rate',
        nameAr: 'معدل إكمال المهام',
        description: 'Percentage of jobs completed on time',
        category: 'OPERATIONAL',
        dataType: 'PERCENTAGE',
        unit: '%',
        formula: 'completedJobs / totalJobs * 100',
        targetValue: 90,
        targetOperator: 'GREATER_THAN',
        frequency: 'WEEKLY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'template-5',
        tenantId: '',
        code: 'EMPLOYEE_UTILIZATION',
        name: 'Employee Utilization',
        nameAr: 'استخدام الموظفين',
        description: 'Percentage of time employees are productive',
        category: 'EMPLOYEE',
        dataType: 'PERCENTAGE',
        unit: '%',
        formula: 'productiveHours / totalHours * 100',
        targetValue: 75,
        targetOperator: 'GREATER_THAN',
        frequency: 'MONTHLY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Import KPI from template
   */
  async importFromTemplate(
    tenantId: string,
    templateId: string
  ): Promise<KPIDefinition> {
    const templates = await this.getKPITemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    return await this.createKPIDefinition(
      tenantId,
      template.code,
      template.name,
      template.nameAr,
      template.description,
      template.category,
      template.dataType,
      template.unit,
      template.formula,
      template.targetValue,
      template.targetOperator,
      template.frequency
    );
  }

  /**
   * Get KPI categories
   */
  async getKPICategories(): Promise<Array<{
    value: string;
    label: string;
    labelAr: string;
  }>> {
    return [
      { value: 'FINANCIAL', label: 'Financial', labelAr: 'مالي' },
      { value: 'OPERATIONAL', label: 'Operational', labelAr: 'تشغيلي' },
      { value: 'CUSTOMER', label: 'Customer', labelAr: 'العملاء' },
      { value: 'EMPLOYEE', label: 'Employee', labelAr: 'الموظفين' },
      { value: 'SERVICE', label: 'Service', labelAr: 'الخدمات' }
    ];
  }

  /**
   * Get KPI summary for dashboard
   */
  async getKPISummary(tenantId: string): Promise<{
    totalKPIs: number;
    activeKPIs: number;
    kpiByCategory: Record<string, number>;
  }> {
    const kpiDefinitions = await this.getKPIDefinitions(tenantId);
    const activeKPIs = kpiDefinitions.filter(k => k.isActive).length;

    const kpiByCategory: Record<string, number> = {};
    for (const kpi of kpiDefinitions) {
      if (!kpiByCategory[kpi.category]) {
        kpiByCategory[kpi.category] = 0;
      }
      kpiByCategory[kpi.category]++;
    }

    return {
      totalKPIs: kpiDefinitions.length,
      activeKPIs,
      kpiByCategory
    };
  }
}

export default new KPIDefinitionsService();
