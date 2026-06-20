import prisma from '../../config/database';

/**
 * Tax Rate Service
 * Manages tax rates for different tax types
 * 
 * Tax rates are used for VAT, income tax, and other tax calculations
 */

export interface TaxRate {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER';
  rate: number;
  effectiveDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TaxRateService {
  /**
   * Create a new tax rate
   */
  async createTaxRate(
    tenantId: string,
    code: string,
    name: string,
    nameAr: string | undefined,
    description: string | undefined,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    rate: number,
    effectiveDate: Date,
    expiryDate?: Date
  ): Promise<TaxRate> {
    // In a real implementation, create in database
    return {
      id: crypto.randomUUID(),
      tenantId,
      code,
      name,
      nameAr,
      description,
      taxType,
      rate,
      effectiveDate,
      expiryDate,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get tax rate by ID
   */
  async getTaxRate(id: string): Promise<TaxRate | null> {
    // In a real implementation, fetch from database
    return null;
  }

  /**
   * Get all tax rates for a tenant
   */
  async getTaxRates(
    tenantId: string,
    taxType?: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    isActive?: boolean
  ): Promise<TaxRate[]> {
    // In a real implementation, fetch from database
    return [];
  }

  /**
   * Get effective tax rate for a specific date
   */
  async getEffectiveTaxRate(
    tenantId: string,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    asOfDate: Date = new Date()
  ): Promise<TaxRate | null> {
    const taxRates = await this.getTaxRates(tenantId, taxType, true);

    // Find the rate that is effective on the given date
    for (const taxRate of taxRates) {
      if (taxRate.effectiveDate <= asOfDate) {
        if (!taxRate.expiryDate || taxRate.expiryDate >= asOfDate) {
          return taxRate;
        }
      }
    }

    return null;
  }

  /**
   * Update tax rate
   */
  async updateTaxRate(
    id: string,
    updates: {
      code?: string;
      name?: string;
      nameAr?: string;
      description?: string;
      taxType?: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER';
      rate?: number;
      effectiveDate?: Date;
      expiryDate?: Date;
      isActive?: boolean;
    }
  ): Promise<TaxRate> {
    const taxRate = await this.getTaxRate(id);
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    return {
      ...taxRate,
      ...updates,
      updatedAt: new Date()
    };
  }

  /**
   * Delete tax rate
   */
  async deleteTaxRate(id: string): Promise<boolean> {
    // In a real implementation, delete from database
    return true;
  }

  /**
   * Calculate tax amount
   */
  async calculateTax(
    tenantId: string,
    amount: number,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    asOfDate: Date = new Date()
  ): Promise<{
    taxRate: TaxRate | null;
    taxAmount: number;
    totalWithTax: number;
  }> {
    const taxRate = await this.getEffectiveTaxRate(tenantId, taxType, asOfDate);
    const taxAmount = taxRate ? (amount * taxRate.rate) / 100 : 0;
    const totalWithTax = amount + taxAmount;

    return {
      taxRate,
      taxAmount,
      totalWithTax
    };
  }

  /**
   * Get tax rate history
   */
  async getTaxRateHistory(
    tenantId: string,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER'
  ): Promise<TaxRate[]> {
    const taxRates = await this.getTaxRates(tenantId, taxType);
    
    // Sort by effective date descending
    return taxRates.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
  }

  /**
   * Deactivate old tax rates
   */
  async deactivateOldRates(
    tenantId: string,
    beforeDate: Date
  ): Promise<number> {
    const taxRates = await this.getTaxRates(tenantId);
    let deactivatedCount = 0;

    for (const taxRate of taxRates) {
      if (taxRate.isActive && taxRate.effectiveDate < beforeDate) {
        await this.updateTaxRate(taxRate.id, { isActive: false });
        deactivatedCount++;
      }
    }

    return deactivatedCount;
  }

  /**
   * Get tax summary for dashboard
   */
  async getTaxSummary(tenantId: string): Promise<{
    totalTaxRates: number;
    activeTaxRates: number;
    taxByType: Record<string, number>;
  }> {
    const taxRates = await this.getTaxRates(tenantId);
    const activeTaxRates = taxRates.filter(tr => tr.isActive).length;

    const taxByType: Record<string, number> = {};
    for (const taxRate of taxRates) {
      if (!taxByType[taxRate.taxType]) {
        taxByType[taxRate.taxType] = 0;
      }
      taxByType[taxRate.taxType]++;
    }

    return {
      totalTaxRates: taxRates.length,
      activeTaxRates,
      taxByType
    };
  }
}

export default new TaxRateService();
