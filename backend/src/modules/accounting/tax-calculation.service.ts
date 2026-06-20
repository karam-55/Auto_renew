import { Logger } from '../../infrastructure/logging/logger';
import prisma from '../../config/database';
import { TaxRateService, TaxRate } from './tax-rate.service';
import settingsService from '../../services/settings.service';

/**
 * Tax Calculation Engine
 * Calculates taxes for invoices, services, and other transactions
 * 
 * Handles VAT, income tax, and other tax calculations with support for exemptions
 */

export interface TaxCalculation {
  taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER';
  taxRate: TaxRate | null;
  taxableAmount: number;
  taxAmount: number;
  totalWithTax: number;
  isExempt: boolean;
  exemptionReason?: string;
}

export interface TaxLiability {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER';
  totalTaxCollected: number;
  totalTaxPaid: number;
  netTaxLiability: number;
  transactions: number;
}

export class TaxCalculationService {
  private taxRateService = new TaxRateService();

  /**
   * Calculate tax for a transaction
   */
  async calculateTransactionTax(
    tenantId: string,
    amount: number,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    isExempt: boolean = false,
    exemptionReason?: string,
    asOfDate: Date = new Date()
  ): Promise<TaxCalculation> {
    // First try to get tax rate from TaxRateService
    let taxRate = await this.taxRateService.getEffectiveTaxRate(tenantId, taxType, asOfDate);
    
    // If no specific tax rate found, fall back to CompanySettings taxRate
    if (!taxRate && taxType === 'VAT') {
      try {
        const settings = await settingsService.getSettings(tenantId);
        if (settings.taxRate > 0) {
          taxRate = {
            id: 'settings-default',
            tenantId,
            code: 'DEFAULT',
            name: 'Default VAT Rate',
            taxType: 'VAT',
            rate: Number(settings.taxRate),
            effectiveDate: new Date(),
            expiryDate: undefined,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      } catch (error) {
        Logger.error('Failed to get settings for tax rate:', error);
      }
    }
    
    if (isExempt) {
      return {
        taxType,
        taxRate: null,
        taxableAmount: amount,
        taxAmount: 0,
        totalWithTax: amount,
        isExempt: true,
        exemptionReason
      };
    }

    const taxAmount = taxRate ? (amount * taxRate.rate) / 100 : 0;
    const totalWithTax = amount + taxAmount;

    return {
      taxType,
      taxRate,
      taxableAmount: amount,
      taxAmount,
      totalWithTax,
      isExempt: false
    };
  }

  /**
   * Calculate multiple taxes for a transaction
   */
  async calculateMultipleTaxes(
    tenantId: string,
    amount: number,
    taxTypes: Array<'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER'>,
    asOfDate: Date = new Date()
  ): Promise<{
    calculations: TaxCalculation[];
    totalTaxAmount: number;
    totalWithAllTaxes: number;
  }> {
    const calculations = await Promise.all(
      taxTypes.map(taxType =>
        this.calculateTransactionTax(tenantId, amount, taxType, false, undefined, asOfDate)
      )
    );

    const totalTaxAmount = calculations.reduce((sum, calc) => sum + calc.taxAmount, 0);
    const totalWithAllTaxes = amount + totalTaxAmount;

    return {
      calculations,
      totalTaxAmount,
      totalWithAllTaxes
    };
  }

  /**
   * Calculate tax liability for a period
   */
  async calculateTaxLiability(
    tenantId: string,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    periodStart: Date,
    periodEnd: Date
  ): Promise<TaxLiability> {
    // Get tax collected (from sales)
    const taxCollected = await this.calculateTaxCollected(
      tenantId,
      taxType,
      periodStart,
      periodEnd
    );

    // Get tax paid (from purchases)
    const taxPaid = await this.calculateTaxPaid(
      tenantId,
      taxType,
      periodStart,
      periodEnd
    );

    const netTaxLiability = taxCollected - taxPaid;

    return {
      tenantId,
      periodStart,
      periodEnd,
      taxType,
      totalTaxCollected: taxCollected,
      totalTaxPaid: taxPaid,
      netTaxLiability,
      transactions: 0 // Would count actual transactions
    };
  }

  /**
   * Calculate tax collected from sales
   */
  private async calculateTaxCollected(
    tenantId: string,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In a real implementation, sum tax from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    let totalTaxCollected = 0;
    for (const invoice of invoices) {
      // Calculate tax based on invoice total and tax rate
      const taxRate = await this.taxRateService.getEffectiveTaxRate(tenantId, taxType, invoice.createdAt);
      if (taxRate) {
        totalTaxCollected += (Number(invoice.totalSYP) * taxRate.rate) / 100;
      }
    }

    return totalTaxCollected;
  }

  /**
   * Calculate tax paid on purchases
   */
  private async calculateTaxPaid(
    tenantId: string,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In a real implementation, sum tax from purchase invoices
    // For now, return 0
    return 0;
  }

  /**
   * Get tax liability summary for all tax types
   */
  async getTaxLiabilitySummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TaxLiability[]> {
    const taxTypes: Array<'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER'> = [
      'VAT',
      'INCOME_TAX',
      'SALES_TAX',
      'SERVICE_TAX',
      'OTHER'
    ];

    return await Promise.all(
      taxTypes.map(taxType =>
        this.calculateTaxLiability(tenantId, taxType, periodStart, periodEnd)
      )
    );
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    liabilities: TaxLiability[];
    totalLiability: number;
    totalRefund: number;
    netPosition: number;
  }> {
    const liabilities = await this.getTaxLiabilitySummary(tenantId, periodStart, periodEnd);
    
    const totalLiability = liabilities
      .filter(l => l.netTaxLiability > 0)
      .reduce((sum, l) => sum + l.netTaxLiability, 0);
    
    const totalRefund = Math.abs(
      liabilities
        .filter(l => l.netTaxLiability < 0)
        .reduce((sum, l) => sum + l.netTaxLiability, 0)
    );
    
    const netPosition = totalLiability - totalRefund;

    return {
      liabilities,
      totalLiability,
      totalRefund,
      netPosition
    };
  }

  /**
   * Validate tax calculation
   */
  async validateTaxCalculation(
    tenantId: string,
    amount: number,
    taxType: 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'OTHER',
    expectedTaxAmount: number,
    asOfDate: Date = new Date()
  ): Promise<{
    isValid: boolean;
    calculatedTax: number;
    difference: number;
    tolerance: number;
  }> {
    const calculation = await this.calculateTransactionTax(
      tenantId,
      amount,
      taxType,
      false,
      undefined,
      asOfDate
    );

    const difference = Math.abs(calculation.taxAmount - expectedTaxAmount);
    const tolerance = amount * 0.01; // 1% tolerance
    const isValid = difference <= tolerance;

    return {
      isValid,
      calculatedTax: calculation.taxAmount,
      difference,
      tolerance
    };
  }

  /**
   * Get tax calculation history
   */
  async getTaxCalculationHistory(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TaxCalculation[]> {
    // In a real implementation, fetch from database
    return [];
  }
}

export default new TaxCalculationService();
