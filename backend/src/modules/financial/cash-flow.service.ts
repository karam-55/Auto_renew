import { AccountType } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Cash Flow Statement Service
 * Generates cash flow statement with operating, investing, and financing activities
 * 
 * Cash Flow Statement shows cash inflows and outflows during a period
 */

export interface CashFlowLineItem {
  accountId?: string;
  accountCode?: string;
  accountName: string;
  accountNameAr?: string;
  amountSYP: number;
  amountUSD?: number;
  level: number;
}

export interface CashFlowSection {
  title: string;
  titleAr?: string;
  items: CashFlowLineItem[];
  totalSYP: number;
  totalUSD?: number;
}

export interface CashFlowStatement {
  tenantId: string;
  fiscalPeriodId?: string;
  periodStart: Date;
  periodEnd: Date;
  currencyCode: string;
  sections: {
    operating: CashFlowSection;
    investing: CashFlowSection;
    financing: CashFlowSection;
  };
  netCashFlowFromOperatingSYP: number;
  netCashFlowFromInvestingSYP: number;
  netCashFlowFromFinancingSYP: number;
  netChangeInCashSYP: number;
  cashAtBeginningSYP: number;
  cashAtEndSYP: number;
  netCashFlowFromOperatingUSD?: number;
  netCashFlowFromInvestingUSD?: number;
  netCashFlowFromFinancingUSD?: number;
  netChangeInCashUSD?: number;
  cashAtBeginningUSD?: number;
  cashAtEndUSD?: number;
  generatedAt: Date;
}

export class CashFlowService {
  /**
   * Generate cash flow statement for a period
   */
  async generateCashFlowStatement(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    fiscalPeriodId?: string,
    currencyCode: string = 'SYP'
  ): Promise<CashFlowStatement> {
    // Get cash accounts (1000-1999 range for assets)
    const cashAccounts = await prisma.account.findMany({
      where: {
        tenantId,
        isActive: true,
        accountType: AccountType.ASSET,
        code: {
          startsWith: '1'
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    // Calculate cash at beginning of period
    const cashAtBeginning = await this.calculateCashBalance(tenantId, periodStart, cashAccounts);

    // Calculate cash at end of period
    const cashAtEnd = await this.calculateCashBalance(tenantId, periodEnd, cashAccounts);

    // Calculate cash flows from operating activities
    const operating = await this.calculateOperatingCashFlows(
      tenantId,
      periodStart,
      periodEnd
    );

    // Calculate cash flows from investing activities
    const investing = await this.calculateInvestingCashFlows(
      tenantId,
      periodStart,
      periodEnd
    );

    // Calculate cash flows from financing activities
    const financing = await this.calculateFinancingCashFlows(
      tenantId,
      periodStart,
      periodEnd
    );

    // Calculate totals
    const netCashFlowFromOperatingSYP = operating.totalSYP;
    const netCashFlowFromInvestingSYP = investing.totalSYP;
    const netCashFlowFromFinancingSYP = financing.totalSYP;
    const netChangeInCashSYP = netCashFlowFromOperatingSYP + netCashFlowFromInvestingSYP + netCashFlowFromFinancingSYP;

    // Convert to USD if needed
    let netCashFlowFromOperatingUSD: number | undefined;
    let netCashFlowFromInvestingUSD: number | undefined;
    let netCashFlowFromFinancingUSD: number | undefined;
    let netChangeInCashUSD: number | undefined;
    let cashAtBeginningUSD: number | undefined;
    let cashAtEndUSD: number | undefined;

    if (currencyCode === 'USD') {
      const exchangeRate = await this.getExchangeRate(tenantId, periodEnd);
      if (exchangeRate) {
        netCashFlowFromOperatingUSD = netCashFlowFromOperatingSYP / exchangeRate;
        netCashFlowFromInvestingUSD = netCashFlowFromInvestingSYP / exchangeRate;
        netCashFlowFromFinancingUSD = netCashFlowFromFinancingSYP / exchangeRate;
        netChangeInCashUSD = netChangeInCashSYP / exchangeRate;
        cashAtBeginningUSD = cashAtBeginning / exchangeRate;
        cashAtEndUSD = cashAtEnd / exchangeRate;
      }
    }

    return {
      tenantId,
      fiscalPeriodId,
      periodStart,
      periodEnd,
      currencyCode,
      sections: {
        operating,
        investing,
        financing
      },
      netCashFlowFromOperatingSYP,
      netCashFlowFromInvestingSYP,
      netCashFlowFromFinancingSYP,
      netChangeInCashSYP,
      cashAtBeginningSYP: cashAtBeginning,
      cashAtEndSYP: cashAtEnd,
      netCashFlowFromOperatingUSD,
      netCashFlowFromInvestingUSD,
      netCashFlowFromFinancingUSD,
      netChangeInCashUSD,
      cashAtBeginningUSD,
      cashAtEndUSD,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate cash balance at a specific date
   */
  private async calculateCashBalance(
    tenantId: string,
    asOfDate: Date,
    cashAccounts: any[]
  ): Promise<number> {
    let totalBalance = 0;

    for (const account of cashAccounts) {
      const journalLines = await prisma.journalLine.findMany({
        where: {
          entry: {
            tenantId,
            entryDate: {
              lte: asOfDate
            },
            status: 'POSTED'
          },
          accountId: account.id
        }
      });

      for (const line of journalLines) {
        const debitSYP = Number(line.debitSYP || 0);
        const creditSYP = Number(line.creditSYP || 0);
        totalBalance += debitSYP - creditSYP;
      }
    }

    return totalBalance;
  }

  /**
   * Calculate cash flows from operating activities
   * (Revenue, Expenses, Accounts Receivable/Payable changes)
   */
  private async calculateOperatingCashFlows(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CashFlowSection> {
    const items: CashFlowLineItem[] = [];

    // Cash received from customers (invoices paid)
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          tenantId
        },
        paymentDate: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    const cashFromCustomers = payments.reduce((sum, p) => sum + Number(p.amountSYP), 0);
    items.push({
      accountName: 'Cash Received from Customers',
      accountNameAr: 'النقد المستلم من العملاء',
      amountSYP: cashFromCustomers,
      level: 1
    });

    // Cash paid to suppliers (parts, services)
    const cashPaidToSuppliers = await this.calculateCashPaidToSuppliers(
      tenantId,
      periodStart,
      periodEnd
    );
    items.push({
      accountName: 'Cash Paid to Suppliers',
      accountNameAr: 'النقد المدفوع للموردين',
      amountSYP: -cashPaidToSuppliers,
      level: 1
    });

    // Cash paid for expenses (salaries, rent, utilities)
    const cashPaidForExpenses = await this.calculateCashPaidForExpenses(
      tenantId,
      periodStart,
      periodEnd
    );
    items.push({
      accountName: 'Cash Paid for Operating Expenses',
      accountNameAr: 'النقد المدفوع للمصاريف التشغيلية',
      amountSYP: -cashPaidForExpenses,
      level: 1
    });

    // Tax payments
    const taxPayments = await this.calculateTaxPayments(
      tenantId,
      periodStart,
      periodEnd
    );
    if (taxPayments > 0) {
      items.push({
        accountName: 'Tax Payments',
        accountNameAr: 'مدفوعات الضرائب',
        amountSYP: -taxPayments,
        level: 1
      });
    }

    const totalSYP = items.reduce((sum, item) => sum + item.amountSYP, 0);

    return {
      title: 'Operating Activities',
      titleAr: 'الأنشطة التشغيلية',
      items,
      totalSYP
    };
  }

  /**
   * Calculate cash flows from investing activities
   * (Purchase/sale of assets, equipment, investments)
   */
  private async calculateInvestingCashFlows(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CashFlowSection> {
    const items: CashFlowLineItem[] = [];

    // Purchase of parts/inventory
    const partsPurchased = await this.calculatePartsPurchases(
      tenantId,
      periodStart,
      periodEnd
    );
    if (partsPurchased > 0) {
      items.push({
        accountName: 'Purchase of Parts/Inventory',
        accountNameAr: 'شراء القطع/المخزون',
        amountSYP: -partsPurchased,
        level: 1
      });
    }

    // Equipment purchases (from journal entries)
    const equipmentPurchases = await this.calculateEquipmentPurchases(
      tenantId,
      periodStart,
      periodEnd
    );
    if (equipmentPurchases > 0) {
      items.push({
        accountName: 'Purchase of Equipment',
        accountNameAr: 'شراء المعدات',
        amountSYP: -equipmentPurchases,
        level: 1
      });
    }

    const totalSYP = items.reduce((sum, item) => sum + item.amountSYP, 0);

    return {
      title: 'Investing Activities',
      titleAr: 'الأنشطة الاستثمارية',
      items,
      totalSYP
    };
  }

  /**
   * Calculate cash flows from financing activities
   * (Loans, capital contributions, dividends)
   */
  private async calculateFinancingCashFlows(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<CashFlowSection> {
    const items: CashFlowLineItem[] = [];

    // Capital contributions (from journal entries)
    const capitalContributions = await this.calculateCapitalContributions(
      tenantId,
      periodStart,
      periodEnd
    );
    if (capitalContributions > 0) {
      items.push({
        accountName: 'Capital Contributions',
        accountNameAr: 'مساهمات رأس المال',
        amountSYP: capitalContributions,
        level: 1
      });
    }

    // Loan repayments
    const loanRepayments = await this.calculateLoanRepayments(
      tenantId,
      periodStart,
      periodEnd
    );
    if (loanRepayments > 0) {
      items.push({
        accountName: 'Loan Repayments',
        accountNameAr: 'سداد القروض',
        amountSYP: -loanRepayments,
        level: 1
      });
    }

    // Owner withdrawals
    const withdrawals = await this.calculateOwnerWithdrawals(
      tenantId,
      periodStart,
      periodEnd
    );
    if (withdrawals > 0) {
      items.push({
        accountName: 'Owner Withdrawals',
        accountNameAr: 'سحوبات المالك',
        amountSYP: -withdrawals,
        level: 1
      });
    }

    const totalSYP = items.reduce((sum, item) => sum + item.amountSYP, 0);

    return {
      title: 'Financing Activities',
      titleAr: 'الأنشطة التمويلية',
      items,
      totalSYP
    };
  }

  /**
   * Helper: Calculate cash paid to suppliers
   */
  private async calculateCashPaidToSuppliers(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // This would track payments to suppliers
    // For now, return 0 as this needs supplier payment tracking
    return 0;
  }

  /**
   * Helper: Calculate cash paid for expenses
   */
  private async calculateCashPaidForExpenses(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get payroll payments
    const payrollPayments = await prisma.payrollRecord.findMany({
      where: {
        tenantId,
        paidAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: 'PAID'
      }
    });

    const totalPayroll = payrollPayments.reduce((sum, p) => sum + Number(p.netSalarySYP), 0);

    return totalPayroll;
  }

  /**
   * Helper: Calculate tax payments
   */
  private async calculateTaxPayments(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // This would track tax payments
    // For now, return 0
    return 0;
  }

  /**
   * Helper: Calculate parts purchases
   */
  private async calculatePartsPurchases(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get inventory transactions for purchases
    const purchases = await prisma.inventoryTransaction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        type: 'PURCHASE'
      }
    });

    return purchases.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.costSYP)), 0);
  }

  /**
   * Helper: Calculate equipment purchases
   */
  private async calculateEquipmentPurchases(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get journal entries for equipment purchases (account code 15xx)
    const equipmentJournalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          },
          status: 'POSTED'
        },
        account: {
          code: {
            startsWith: '15'
          }
        }
      },
      include: {
        account: true
      }
    });

    return equipmentJournalLines.reduce((sum, line) => sum + Number(line.debitSYP || 0), 0);
  }

  /**
   * Helper: Calculate capital contributions
   */
  private async calculateCapitalContributions(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get journal entries for capital (account code 30xx)
    const capitalJournalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          },
          status: 'POSTED'
        },
        account: {
          code: {
            startsWith: '30'
          }
        }
      },
      include: {
        account: true
      }
    });

    return capitalJournalLines.reduce((sum, line) => sum + Number(line.creditSYP || 0), 0);
  }

  /**
   * Helper: Calculate loan repayments
   */
  private async calculateLoanRepayments(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get journal entries for loan repayments (account code 21xx)
    const loanJournalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          },
          status: 'POSTED'
        },
        account: {
          code: {
            startsWith: '21'
          }
        }
      },
      include: {
        account: true
      }
    });

    return loanJournalLines.reduce((sum, line) => sum + Number(line.debitSYP || 0), 0);
  }

  /**
   * Helper: Calculate owner withdrawals
   */
  private async calculateOwnerWithdrawals(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    // Get journal entries for withdrawals (account code 31xx)
    const withdrawalJournalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          },
          status: 'POSTED'
        },
        account: {
          code: {
            startsWith: '31'
          }
        }
      },
      include: {
        account: true
      }
    });

    return withdrawalJournalLines.reduce((sum, line) => sum + Number(line.debitSYP || 0), 0);
  }

  /**
   * Get exchange rate for a specific date
   */
  private async getExchangeRate(
    tenantId: string,
    date: Date
  ): Promise<number | null> {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        effectiveDate: {
          lte: date
        },
        isActive: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    return exchangeRate ? Number(exchangeRate.rate) : null;
  }
}

export default new CashFlowService();
