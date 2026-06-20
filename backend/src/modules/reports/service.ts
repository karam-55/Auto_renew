import prisma from '../../config/database';
import {
  BalanceSheetRequest,
  BalanceSheetResponse,
  BalanceSheetAccount,
  BalanceSheetSection,
  ProfitLossRequest,
  ProfitLossResponse,
  ProfitLossAccount,
  ProfitLossSection,
  CashFlowRequest,
  CashFlowResponse,
  CashFlowSection,
  CashFlowItem,
  TrialBalanceRequest,
  TrialBalanceResponse,
  TrialBalanceAccount,
  AgedReceivablesRequest,
  AgedReceivablesResponse,
  AgedReceivableCustomer,
  AgedReceivableInvoice,
  AgedPayablesRequest,
  AgedPayablesResponse,
  AgedPayableSupplier,
  AgedPayablePurchaseOrder,
} from './types';
import { AccountType, InvoiceStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export class ReportService {
  // ============================================
  // BALANCE SHEET
  // ============================================

  async generateBalanceSheet(
    tenantId: string,
    request: BalanceSheetRequest
  ): Promise<BalanceSheetResponse> {
    const currency = request.currency || 'SYP';
    const { fromDate, toDate } = request;
    const asOfDate = toDate || new Date();

    // Get all active accounts for the tenant
    const accounts = await prisma.account.findMany({
      where: { tenantId, isActive: true },
      orderBy: { code: 'asc' },
    });

    // Get all journal lines UP TO asOfDate (cumulative — balance sheet is a snapshot)
    const journalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: { lte: asOfDate },
          status: 'POSTED',
        },
      },
      include: {
        account: true,
      },
    });

    // Calculate cumulative balance per account using proper debit/credit rules
    const accountBalances = new Map<string, number>();
    journalLines.forEach((line) => {
      const current = accountBalances.get(line.accountId) || 0;
      const debit = Number(line.debitSYP) || 0;
      const credit = Number(line.creditSYP) || 0;

      // Debit increases balance for: ASSET, EXPENSE, COGS
      // Credit increases balance for: LIABILITY, EQUITY, REVENUE
      if (line.account.accountType === 'ASSET' || line.account.accountType === 'EXPENSE' || line.account.accountType === 'COGS') {
        accountBalances.set(line.accountId, current + debit - credit);
      } else {
        accountBalances.set(line.accountId, current + credit - debit);
      }
    });

    // Calculate Retained Earnings = cumulative Revenue - cumulative Expenses up to asOfDate
    let retainedEarnings = 0;
    journalLines.forEach((line) => {
      const debit = Number(line.debitSYP) || 0;
      const credit = Number(line.creditSYP) || 0;
      if (line.account.accountType === 'REVENUE') {
        retainedEarnings += credit - debit;
      } else if (line.account.accountType === 'EXPENSE' || line.account.accountType === 'COGS') {
        retainedEarnings -= debit - credit;
      }
    });

    // Build balance sheet sections
    const assetAccounts: BalanceSheetAccount[] = [];
    const liabilityAccounts: BalanceSheetAccount[] = [];
    const equityAccounts: BalanceSheetAccount[] = [];

    accounts.forEach((account) => {
      const balance = accountBalances.get(account.id) || 0;
      const bsAccount: BalanceSheetAccount = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameEn || account.nameAr,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        balance,
        currency,
      };

      if (account.accountType === 'ASSET') {
        assetAccounts.push(bsAccount);
      } else if (account.accountType === 'LIABILITY') {
        liabilityAccounts.push(bsAccount);
      } else if (account.accountType === 'EQUITY') {
        equityAccounts.push(bsAccount);
      }
    });

    // Add Retained Earnings as a separate equity line item if non-zero
    if (Math.abs(retainedEarnings) >= 0.01) {
      equityAccounts.push({
        accountId: 'retained-earnings',
        accountCode: '3999',
        accountName: 'Retained Earnings',
        accountNameAr: 'الأرباح المحتجزة',
        accountType: 'EQUITY' as AccountType,
        balance: retainedEarnings,
        currency,
      });
    }

    const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      reportDate: asOfDate,
      currency,
      assets: {
        sectionType: 'ASSETS',
        sectionName: 'Assets',
        sectionNameAr: 'الأصول',
        accounts: assetAccounts,
        total: totalAssets,
        currency,
      },
      liabilities: {
        sectionType: 'LIABILITIES',
        sectionName: 'Liabilities',
        sectionNameAr: 'الخصوم',
        accounts: liabilityAccounts,
        total: totalLiabilities,
        currency,
      },
      equity: {
        sectionType: 'EQUITY',
        sectionName: 'Equity',
        sectionNameAr: 'حقوق الملكية',
        accounts: equityAccounts,
        total: totalEquity,
        currency,
      },
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // PROFIT & LOSS
  // ============================================

  async generateProfitLoss(
    tenantId: string,
    request: ProfitLossRequest
  ): Promise<ProfitLossResponse> {
    const currency = request.currency || 'SYP';
    const { fromDate, toDate } = request;

    // Get journal lines for revenue and expense accounts
    const journalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        account: {
          accountType: {
            in: ['REVENUE', 'COGS', 'EXPENSE'],
          },
        },
      },
      include: {
        account: true,
      },
    });

    // Calculate amounts per account
    const accountAmounts = new Map<string, number>();
    journalLines.forEach((line) => {
      const currentAmount = accountAmounts.get(line.accountId) || 0;
      const debit = Number(line.debitSYP);
      const credit = Number(line.creditSYP);

      // Revenue: credit increases, debit decreases (contra-revenue)
      // COGS & Expense: debit increases, credit decreases
      if (line.account.accountType === 'REVENUE') {
        accountAmounts.set(line.accountId, currentAmount + credit - debit);
      } else {
        accountAmounts.set(line.accountId, currentAmount + debit - credit);
      }
    });

    // Get revenue, COGS and expense accounts
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
        isActive: true,
        accountType: {
          in: ['REVENUE', 'COGS', 'EXPENSE'],
        },
      },
    });

    const revenueAccounts: ProfitLossAccount[] = [];
    const cogsAccounts: ProfitLossAccount[] = [];
    const expenseAccounts: ProfitLossAccount[] = [];

    accounts.forEach((account) => {
      const amount = accountAmounts.get(account.id) || 0;
      const profitLossAccount: ProfitLossAccount = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameEn || account.nameAr,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        amount,
        currency,
      };

      if (account.accountType === 'REVENUE') {
        revenueAccounts.push(profitLossAccount);
      } else if (account.accountType === 'COGS') {
        cogsAccounts.push(profitLossAccount);
      } else {
        expenseAccounts.push(profitLossAccount);
      }
    });

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      fromDate,
      toDate,
      currency,
      revenue: {
        sectionType: 'REVENUE',
        sectionName: 'Revenue',
        sectionNameAr: 'الإيرادات',
        accounts: revenueAccounts,
        total: totalRevenue,
        currency,
      },
      cogs: {
        sectionType: 'COGS',
        sectionName: 'Cost of Goods Sold',
        sectionNameAr: 'تكلفة البضاعة المباعة',
        accounts: cogsAccounts,
        total: totalCOGS,
        currency,
      },
      grossProfit,
      expenses: {
        sectionType: 'EXPENSE',
        sectionName: 'Expenses',
        sectionNameAr: 'المصروفات التشغيلية',
        accounts: expenseAccounts,
        total: totalExpenses,
        currency,
      },
      netProfit,
      netProfitMargin,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // CASH FLOW
  // ============================================

  async generateCashFlow(
    tenantId: string,
    request: CashFlowRequest
  ): Promise<CashFlowResponse> {
    const currency = request.currency || 'SYP';
    const { fromDate, toDate } = request;

    // Get payments (cash inflows from customers)
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        paymentDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Get beginning cash balance (cash account balance before fromDate)
    const cashAccount = await prisma.account.findFirst({
      where: {
        tenantId,
        code: { contains: '1000' }, // Assuming cash account code starts with 1000
        isActive: true,
      },
    });

    let beginningCash = 0;
    if (cashAccount) {
      const beginningJournalLines = await prisma.journalLine.findMany({
        where: {
          accountId: cashAccount.id,
          entry: {
            tenantId,
            entryDate: {
              lt: fromDate,
            },
          },
        },
      });

      beginningJournalLines.forEach((line) => {
        beginningCash += Number(line.debitSYP) - Number(line.creditSYP);
      });
    }

    // Build cash flow items
    const operatingInflows: CashFlowItem[] = [];
    const operatingOutflows: CashFlowItem[] = [];
    const investingInflows: CashFlowItem[] = [];
    const investingOutflows: CashFlowItem[] = [];
    const financingInflows: CashFlowItem[] = [];
    const financingOutflows: CashFlowItem[] = [];

    payments.forEach((payment) => {
      const amount = Number(payment.amountSYP);
      const item: CashFlowItem = {
        id: payment.id,
        date: payment.paymentDate,
        description: `Payment received - ${payment.invoice?.invoiceNumber || 'Direct'}`,
        amount,
        currency,
        type: 'INFLOW',
        category: 'OPERATING',
        reference: payment.reference || undefined,
        referenceType: 'PAYMENT',
      };
      operatingInflows.push(item);
    });

    // Get expense payments (cash outflows)
    const expenseJournalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        account: {
          accountType: 'EXPENSE',
          code: { contains: '1000' }, // Cash-related expense accounts
        },
      },
      include: {
        entry: true,
      },
    });

    expenseJournalLines.forEach((line) => {
      const amount = Number(line.debitSYP);
      if (amount > 0) {
        const item: CashFlowItem = {
          id: line.id,
          date: line.entry.entryDate,
          description: line.description || line.entry.description,
          amount,
          currency,
          type: 'OUTFLOW',
          category: 'OPERATING',
          reference: line.entry.reference || undefined,
          referenceType: line.entry.sourceType || undefined,
        };
        operatingOutflows.push(item);
      }
    });

    const totalOperatingInflow = operatingInflows.reduce((sum, item) => sum + item.amount, 0);
    const totalOperatingOutflow = operatingOutflows.reduce((sum, item) => sum + item.amount, 0);
    const totalInvestingInflow = investingInflows.reduce((sum, item) => sum + item.amount, 0);
    const totalInvestingOutflow = investingOutflows.reduce((sum, item) => sum + item.amount, 0);
    const totalFinancingInflow = financingInflows.reduce((sum, item) => sum + item.amount, 0);
    const totalFinancingOutflow = financingOutflows.reduce((sum, item) => sum + item.amount, 0);

    const netCashFlow =
      totalOperatingInflow -
      totalOperatingOutflow +
      totalInvestingInflow -
      totalInvestingOutflow +
      totalFinancingInflow -
      totalFinancingOutflow;

    const endingCash = beginningCash + netCashFlow;

    return {
      fromDate,
      toDate,
      currency,
      operating: {
        sectionType: 'OPERATING',
        sectionName: 'Operating Activities',
        sectionNameAr: 'الأنشطة التشغيلية',
        inflows: operatingInflows,
        outflows: operatingOutflows,
        totalInflow: totalOperatingInflow,
        totalOutflow: totalOperatingOutflow,
        netFlow: totalOperatingInflow - totalOperatingOutflow,
        currency,
      },
      investing: {
        sectionType: 'INVESTING',
        sectionName: 'Investing Activities',
        sectionNameAr: 'الأنشطة الاستثمارية',
        inflows: investingInflows,
        outflows: investingOutflows,
        totalInflow: totalInvestingInflow,
        totalOutflow: totalInvestingOutflow,
        netFlow: totalInvestingInflow - totalInvestingOutflow,
        currency,
      },
      financing: {
        sectionType: 'FINANCING',
        sectionName: 'Financing Activities',
        sectionNameAr: 'الأنشطة التمويلية',
        inflows: financingInflows,
        outflows: financingOutflows,
        totalInflow: totalFinancingInflow,
        totalOutflow: totalFinancingOutflow,
        netFlow: totalFinancingInflow - totalFinancingOutflow,
        currency,
      },
      netCashFlow,
      beginningCash,
      endingCash,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // TRIAL BALANCE
  // ============================================

  async generateTrialBalance(
    tenantId: string,
    request: TrialBalanceRequest
  ): Promise<TrialBalanceResponse> {
    const currency = request.currency || 'SYP';
    const { fromDate, toDate } = request;

    // Get all journal lines within date range
    const journalLines = await prisma.journalLine.findMany({
      where: {
        entry: {
          tenantId,
          entryDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      include: {
        account: true,
      },
    });

    // Calculate debit/credit totals per account
    const accountTotals = new Map<string, { debit: number; credit: number }>();
    journalLines.forEach((line) => {
      const current = accountTotals.get(line.accountId) || { debit: 0, credit: 0 };
      current.debit += Number(line.debitSYP);
      current.credit += Number(line.creditSYP);
      accountTotals.set(line.accountId, current);
    });

    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: { tenantId, isActive: true },
    });

    const trialBalanceAccounts: TrialBalanceAccount[] = [];

    accounts.forEach((account) => {
      const totals = accountTotals.get(account.id) || { debit: 0, credit: 0 };

      // Balance depends on account type per GAAP:
      // ASSET, EXPENSE: normal debit balance = debit - credit
      // LIABILITY, EQUITY, REVENUE: normal credit balance = credit - debit
      let balance = 0;
      let balanceType: 'DEBIT' | 'CREDIT';
      if (account.accountType === 'ASSET' || account.accountType === 'COGS' || account.accountType === 'EXPENSE') {
        balance = totals.debit - totals.credit;
        balanceType = balance >= 0 ? 'DEBIT' : 'CREDIT';
      } else {
        balance = totals.credit - totals.debit;
        balanceType = balance >= 0 ? 'CREDIT' : 'DEBIT';
      }

      trialBalanceAccounts.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameEn || account.nameAr,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        debitTotal: totals.debit,
        creditTotal: totals.credit,
        balance: Math.abs(balance),
        balanceType,
        currency,
      });
    });

    const totalDebit = trialBalanceAccounts.reduce((sum, acc) => sum + acc.debitTotal, 0);
    const totalCredit = trialBalanceAccounts.reduce((sum, acc) => sum + acc.creditTotal, 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01;

    return {
      fromDate,
      toDate,
      currency,
      accounts: trialBalanceAccounts,
      totalDebit,
      totalCredit,
      isBalanced,
      difference,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // AGED RECEIVABLES
  // ============================================

  async generateAgedReceivables(
    tenantId: string,
    request: AgedReceivablesRequest
  ): Promise<AgedReceivablesResponse> {
    const currency = request.currency || 'SYP';
    const { asOfDate } = request;

    // Get all unpaid/partially paid invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE],
        },
        invoiceDate: {
          lte: asOfDate,
        },
      },
      include: {
        customer: true,
        payments: true,
      },
    });

    // Group by customer
    const customerMap = new Map<string, AgedReceivableCustomer>();

    invoices.forEach((invoice) => {
      const customerId = invoice.customerId || 'unknown';
      const paidAmount = invoice.payments.reduce((sum, p) => sum + Number(p.amountSYP), 0);
      const outstandingAmount = Number(invoice.totalSYP) - paidAmount;

      if (outstandingAmount <= 0) return;

      const daysOverdue = Math.max(
        0,
        Math.floor((asOfDate.getTime() - (invoice.dueDate || invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))
      );

      let agingBucket: 'CURRENT' | '1_30' | '31_60' | '61_90' | 'OVER_90' = 'CURRENT';
      if (daysOverdue > 90) agingBucket = 'OVER_90';
      else if (daysOverdue > 60) agingBucket = '61_90';
      else if (daysOverdue > 30) agingBucket = '31_60';
      else if (daysOverdue > 0) agingBucket = '1_30';

      const agedInvoice: AgedReceivableInvoice = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || invoice.invoiceDate,
        totalAmount: Number(invoice.totalSYP),
        paidAmount,
        outstandingAmount,
        daysOverdue,
        agingBucket,
        currency,
      };

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: invoice.customer?.fullName || 'Unknown',
          customerPhone: invoice.customer?.phone || '',
          totalOutstanding: 0,
          currency,
          agingBuckets: {
            current: 0,
            days1_30: 0,
            days31_60: 0,
            days61_90: 0,
            daysOver90: 0,
          },
          invoices: [],
        });
      }

      const customer = customerMap.get(customerId)!;
      customer.totalOutstanding += outstandingAmount;
      customer.invoices.push(agedInvoice);

      if (agingBucket === 'CURRENT') customer.agingBuckets.current += outstandingAmount;
      else if (agingBucket === '1_30') customer.agingBuckets.days1_30 += outstandingAmount;
      else if (agingBucket === '31_60') customer.agingBuckets.days31_60 += outstandingAmount;
      else if (agingBucket === '61_90') customer.agingBuckets.days61_90 += outstandingAmount;
      else if (agingBucket === 'OVER_90') customer.agingBuckets.daysOver90 += outstandingAmount;
    });

    const customers = Array.from(customerMap.values());
    const totalOutstanding = customers.reduce((sum, c) => sum + c.totalOutstanding, 0);

    const agingSummary = {
      current: customers.reduce((sum, c) => sum + c.agingBuckets.current, 0),
      days1_30: customers.reduce((sum, c) => sum + c.agingBuckets.days1_30, 0),
      days31_60: customers.reduce((sum, c) => sum + c.agingBuckets.days31_60, 0),
      days61_90: customers.reduce((sum, c) => sum + c.agingBuckets.days61_90, 0),
      daysOver90: customers.reduce((sum, c) => sum + c.agingBuckets.daysOver90, 0),
    };

    return {
      asOfDate,
      currency,
      customers,
      totalOutstanding,
      agingSummary,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // AGED PAYABLES
  // ============================================

  async generateAgedPayables(
    tenantId: string,
    request: AgedPayablesRequest
  ): Promise<AgedPayablesResponse> {
    const currency = request.currency || 'SYP';
    const { asOfDate } = request;

    // Get purchase orders with outstanding amounts
    // Note: This uses PurchaseOrder model from the schema
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        status: {
          in: ['APPROVED', 'RECEIVED'],
        },
        orderDate: {
          lte: asOfDate,
        },
      },
      include: {
        supplier: true,
      },
    });

    // Group by supplier
    const supplierMap = new Map<string, AgedPayableSupplier>();

    purchaseOrders.forEach((po) => {
      const supplierId = po.supplierId || 'unknown';
      const paidAmount = 0; // Purchase orders don't have payments in this schema
      const outstandingAmount = Number(po.totalSYP) - paidAmount;

      if (outstandingAmount <= 0) return;

      const daysOverdue = Math.max(
        0,
        Math.floor((asOfDate.getTime() - po.orderDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      let agingBucket: 'CURRENT' | '1_30' | '31_60' | '61_90' | 'OVER_90' = 'CURRENT';
      if (daysOverdue > 90) agingBucket = 'OVER_90';
      else if (daysOverdue > 60) agingBucket = '61_90';
      else if (daysOverdue > 30) agingBucket = '31_60';
      else if (daysOverdue > 0) agingBucket = '1_30';

      const agedPO: AgedPayablePurchaseOrder = {
        purchaseOrderId: po.id,
        orderNumber: po.orderNumber,
        orderDate: po.orderDate,
        dueDate: po.orderDate,
        totalAmount: Number(po.totalSYP),
        paidAmount,
        outstandingAmount,
        daysOverdue,
        agingBucket,
        currency,
      };

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          supplierId,
          supplierName: po.supplier?.name || 'Unknown',
          supplierPhone: po.supplier?.phone || '',
          totalOutstanding: 0,
          currency,
          agingBuckets: {
            current: 0,
            days1_30: 0,
            days31_60: 0,
            days61_90: 0,
            daysOver90: 0,
          },
          purchaseOrders: [],
        });
      }

      const supplier = supplierMap.get(supplierId)!;
      supplier.totalOutstanding += outstandingAmount;
      supplier.purchaseOrders.push(agedPO);

      if (agingBucket === 'CURRENT') supplier.agingBuckets.current += outstandingAmount;
      else if (agingBucket === '1_30') supplier.agingBuckets.days1_30 += outstandingAmount;
      else if (agingBucket === '31_60') supplier.agingBuckets.days31_60 += outstandingAmount;
      else if (agingBucket === '61_90') supplier.agingBuckets.days61_90 += outstandingAmount;
      else if (agingBucket === 'OVER_90') supplier.agingBuckets.daysOver90 += outstandingAmount;
    });

    const suppliers = Array.from(supplierMap.values());
    const totalOutstanding = suppliers.reduce((sum, s) => sum + s.totalOutstanding, 0);

    const agingSummary = {
      current: suppliers.reduce((sum, s) => sum + s.agingBuckets.current, 0),
      days1_30: suppliers.reduce((sum, s) => sum + s.agingBuckets.days1_30, 0),
      days31_60: suppliers.reduce((sum, s) => sum + s.agingBuckets.days31_60, 0),
      days61_90: suppliers.reduce((sum, s) => sum + s.agingBuckets.days61_90, 0),
      daysOver90: suppliers.reduce((sum, s) => sum + s.agingBuckets.daysOver90, 0),
    };

    return {
      asOfDate,
      currency,
      suppliers,
      totalOutstanding,
      agingSummary,
      generatedAt: new Date(),
    };
  }

  // ============================================
  // PDF EXPORT
  // ============================================

  async exportBalanceSheetToPDF(
    tenantId: string,
    request: BalanceSheetRequest
  ): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.generateBalanceSheet(tenantId, request);
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text('Balance Sheet', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`As of: ${report.reportDate.toLocaleDateString()}`, { align: 'center' });
    doc.text(`Currency: ${report.currency}`, { align: 'center' });
    doc.moveDown();

    // Assets
    doc.fontSize(14).text('Assets', { underline: true });
    doc.moveDown(0.5);
    report.assets.accounts.forEach((acc) => {
      doc.fontSize(10).text(`${acc.accountCode} - ${acc.accountName}`, { continued: true });
      doc.text(` ${acc.balance.toFixed(2)} ${acc.currency}`, { align: 'right' });
    });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Assets: ${report.totalAssets.toFixed(2)} ${report.currency}`, { align: 'right' });
    doc.moveDown();

    // Liabilities
    doc.fontSize(14).text('Liabilities', { underline: true });
    doc.moveDown(0.5);
    report.liabilities.accounts.forEach((acc) => {
      doc.fontSize(10).text(`${acc.accountCode} - ${acc.accountName}`, { continued: true });
      doc.text(` ${acc.balance.toFixed(2)} ${acc.currency}`, { align: 'right' });
    });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Liabilities: ${report.totalLiabilities.toFixed(2)} ${report.currency}`, { align: 'right' });
    doc.moveDown();

    // Equity
    doc.fontSize(14).text('Equity', { underline: true });
    doc.moveDown(0.5);
    report.equity.accounts.forEach((acc) => {
      doc.fontSize(10).text(`${acc.accountCode} - ${acc.accountName}`, { continued: true });
      doc.text(` ${acc.balance.toFixed(2)} ${acc.currency}`, { align: 'right' });
    });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Equity: ${report.totalEquity.toFixed(2)} ${report.currency}`, { align: 'right' });
    doc.moveDown();

    // Footer
    doc.fontSize(10).text(`Generated: ${report.generatedAt.toLocaleString()}`, { align: 'center' });
    doc.text(report.isBalanced ? '✓ Balanced' : '✗ Not Balanced', { align: 'center' });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const filename = `balance-sheet-${Date.now()}.pdf`;
        resolve({ buffer, filename });
      });
    });
  }

  // ============================================
  // EXCEL EXPORT
  // ============================================

  async exportBalanceSheetToExcel(
    tenantId: string,
    request: BalanceSheetRequest
  ): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.generateBalanceSheet(tenantId, request);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Balance Sheet');

    // Header
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'Balance Sheet';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = `As of: ${report.reportDate.toLocaleDateString()}`;
    worksheet.getCell('A3').value = `Currency: ${report.currency}`;

    // Assets
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['ASSETS', '', '']);
    worksheet.getCell('A5').font = { bold: true };
    worksheet.addRow(['Account Code', 'Account Name', 'Balance']);
    worksheet.getRow(6).font = { bold: true };

    report.assets.accounts.forEach((acc) => {
      worksheet.addRow([acc.accountCode, acc.accountName, acc.balance]);
    });

    worksheet.addRow(['', '', '']);
    worksheet.addRow(['Total Assets', '', report.totalAssets]);
    worksheet.getRow(report.assets.accounts.length + 8).font = { bold: true };

    // Liabilities
    const liabStartRow = report.assets.accounts.length + 10;
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['LIABILITIES', '', '']);
    worksheet.getCell(`A${liabStartRow + 1}`).font = { bold: true };
    worksheet.addRow(['Account Code', 'Account Name', 'Balance']);
    worksheet.getRow(liabStartRow + 2).font = { bold: true };

    report.liabilities.accounts.forEach((acc) => {
      worksheet.addRow([acc.accountCode, acc.accountName, acc.balance]);
    });

    worksheet.addRow(['', '', '']);
    worksheet.addRow(['Total Liabilities', '', report.totalLiabilities]);
    worksheet.getRow(liabStartRow + report.liabilities.accounts.length + 4).font = { bold: true };

    // Equity
    const equityStartRow = liabStartRow + report.liabilities.accounts.length + 6;
    worksheet.addRow(['', '', '']);
    worksheet.addRow(['EQUITY', '', '']);
    worksheet.getCell(`A${equityStartRow + 1}`).font = { bold: true };
    worksheet.addRow(['Account Code', 'Account Name', 'Balance']);
    worksheet.getRow(equityStartRow + 2).font = { bold: true };

    report.equity.accounts.forEach((acc) => {
      worksheet.addRow([acc.accountCode, acc.accountName, acc.balance]);
    });

    worksheet.addRow(['', '', '']);
    worksheet.addRow(['Total Equity', '', report.totalEquity]);
    worksheet.getRow(equityStartRow + report.equity.accounts.length + 4).font = { bold: true };

    // Footer
    const footerRow = equityStartRow + report.equity.accounts.length + 6;
    worksheet.addRow(['', '', '']);
    worksheet.addRow([`Generated: ${report.generatedAt.toLocaleString()}`, '', report.isBalanced ? 'Balanced' : 'Not Balanced']);

    worksheet.columns.forEach((column) => {
      column.width = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const filename = `balance-sheet-${Date.now()}.xlsx`;

    return { buffer, filename };
  }

  // ============================================
  // INVENTORY REPORTS
  // ============================================

  async getCurrentInventoryReport(tenantId: string, branchId?: string) {
    const where: any = { tenantId, isActive: true };
    
    // Filter by branch if specified and branchId != "all"
    if (branchId && branchId !== 'all') {
      where.warehouses = {
        some: {
          branchId,
        },
      };
    }

    const parts = await prisma.part.findMany({
      where,
      include: {
        category: true,
      },
    });

    return parts.map((part) => {
      const status = part.quantity > part.minQuantity ? 'OK' : part.quantity === part.minQuantity ? 'LOW' : 'CRITICAL';
      const totalValue = Number(part.costSYP) * part.quantity;

      return {
        partId: part.id,
        partName: part.name,
        partNumber: part.partNumber,
        category: part.category?.name || 'Uncategorized',
        quantity: part.quantity,
        minQuantity: part.minQuantity,
        status,
        purchasePrice: Number(part.costSYP),
        salePrice: Number(part.sellingPriceSYP),
        totalValue,
      };
    });
  }

  async getPartsConsumptionReport(tenantId: string, branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: any = {
      part: { tenantId },
      type: 'CONSUMPTION',
    };

    // Filter by branch if specified and branchId != "all"
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        part: true,
      },
    });

    const consumptionMap = new Map<string, { totalConsumed: number; totalCost: number; services: Set<string>; invoices: Set<string> }>();

    transactions.forEach((t) => {
      const existing = consumptionMap.get(t.partId) || {
        totalConsumed: 0,
        totalCost: 0,
        services: new Set<string>(),
        invoices: new Set<string>(),
      };

      existing.totalConsumed += t.quantity;
      existing.totalCost += Number(t.costSYP) * t.quantity;

      consumptionMap.set(t.partId, existing);
    });

    return Array.from(consumptionMap.entries()).map(([partId, data]) => {
      const part = transactions.find((t) => t.partId === partId)?.part;
      return {
        partId,
        partName: part?.name || 'Unknown',
        partNumber: part?.partNumber || '',
        totalConsumed: data.totalConsumed,
        totalCost: data.totalCost,
        servicesUsedIn: data.services.size,
        invoicesUsedIn: data.invoices.size,
      };
    });
  }

  async getStockMovementsReport(tenantId: string, branchId?: string, fromDate?: Date, toDate?: Date, type?: string) {
    const where: any = {
      part: { tenantId },
    };

    // Filter by branch if specified and branchId != "all"
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    if (type) {
      where.type = type;
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        part: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) => ({
      id: t.id,
      type: t.type,
      partName: t.part.name,
      partNumber: t.part.partNumber,
      quantity: t.quantity,
      costSYP: Number(t.costSYP),
      createdAt: t.createdAt,
      reason: t.notes || t.reference,
    }));
  }

  async getServiceCostReport(tenantId: string, branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: any = {
      invoice: { tenantId, status: 'ISSUED' },
    };

    // Filter by branch if specified and branchId != "all"
    if (branchId && branchId !== 'all') {
      where.invoice.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.invoice.createdAt = {};
      if (fromDate) where.invoice.createdAt.gte = fromDate;
      if (toDate) where.invoice.createdAt.lte = toDate;
    }

    const invoiceItems = await prisma.invoiceItem.findMany({
      where,
      include: {
        invoice: true,
      },
    });

    // Get services with their parts
    const serviceIds = invoiceItems.map((i) => i.serviceId).filter((id): id is string => id != null);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      include: {
        serviceParts: {
          include: {
            part: true,
          },
        },
      },
    });

    const serviceCostMap = new Map<string, { partsCost: number; servicePrice: number; count: number }>();

    invoiceItems.forEach((item) => {
      if (!item.serviceId) return;

      const existing = serviceCostMap.get(item.serviceId) || {
        partsCost: 0,
        servicePrice: 0,
        count: 0,
      };

      // Calculate parts cost from service parts
      let partsCost = 0;
      const service = services.find((s) => s.id === item.serviceId);
      if (service?.serviceParts) {
        service.serviceParts.forEach((sp: any) => {
          partsCost += Number(sp.part.costSYP) * sp.quantity;
        });
      }

      existing.partsCost += partsCost;
      existing.servicePrice += Number(item.priceSYP);
      existing.count += 1;

      serviceCostMap.set(item.serviceId, existing);
    });

    return Array.from(serviceCostMap.entries()).map(([serviceId, data]) => {
      const service = services.find((s) => s.id === serviceId);
      const profit = data.servicePrice - data.partsCost;
      const profitMargin = data.servicePrice > 0 ? (profit / data.servicePrice) * 100 : 0;

      return {
        serviceId,
        serviceName: service?.name || 'Unknown',
        partsCost: data.partsCost,
        servicePrice: data.servicePrice,
        profit,
        profitMargin,
        count: data.count,
      };
    });
  }

  async getProfitabilityReport(tenantId: string, branchId?: string, fromDate?: Date, toDate?: Date) {
    const where: any = { tenantId, status: 'ISSUED' };

    // Filter by branch if specified and branchId != "all"
    if (branchId && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        customer: true,
      },
    });

    // Get all services with their parts
    const serviceIds = invoices.flatMap((i) => i.items.map((item) => item.serviceId)).filter((id): id is string => id != null);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      include: {
        serviceParts: {
          include: {
            part: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalPartsCost = 0;
    let totalServiceCost = 0;

    const monthlyProfit = new Map<string, { revenue: number; cost: number; profit: number }>();
    const customerProfit = new Map<string, { revenue: number; cost: number; profit: number }>();
    const serviceProfit = new Map<string, { revenue: number; cost: number; profit: number }>();

    invoices.forEach((invoice) => {
      const monthKey = invoice.createdAt.toISOString().substring(0, 7);
      const customerId = invoice.customerId || 'unknown';

      const monthData = monthlyProfit.get(monthKey) || { revenue: 0, cost: 0, profit: 0 };
      const customerData = customerProfit.get(customerId) || { revenue: 0, cost: 0, profit: 0 };

      let invoicePartsCost = 0;
      let invoiceServiceCost = 0;

      invoice.items.forEach((item) => {
        monthData.revenue += Number(item.priceSYP);
        customerData.revenue += Number(item.priceSYP);

        const service = services.find((s) => s.id === item.serviceId);
        if (service?.serviceParts) {
          service.serviceParts.forEach((sp: any) => {
            const cost = Number(sp.part.costSYP) * sp.quantity;
            invoicePartsCost += cost;
            monthData.cost += cost;
            customerData.cost += cost;

            const serviceId = item.serviceId || 'unknown';
            const serviceData = serviceProfit.get(serviceId) || { revenue: 0, cost: 0, profit: 0 };
            serviceData.revenue += Number(item.priceSYP);
            serviceData.cost += cost;
            serviceData.profit = serviceData.revenue - serviceData.cost;
            serviceProfit.set(serviceId, serviceData);
          });
        }
      });

      monthData.profit = monthData.revenue - monthData.cost;
      customerData.profit = customerData.revenue - customerData.cost;

      monthlyProfit.set(monthKey, monthData);
      customerProfit.set(customerId, customerData);

      totalRevenue += monthData.revenue;
      totalPartsCost += invoicePartsCost;
      totalServiceCost += invoiceServiceCost;
    });

    return {
      totalRevenue,
      totalCost: totalPartsCost + totalServiceCost,
      totalProfit: totalRevenue - (totalPartsCost + totalServiceCost),
      invoiceProfit: totalRevenue - totalPartsCost,
      serviceProfit: totalRevenue - totalServiceCost,
      customerProfit: Array.from(customerProfit.entries()).map(([customerId, data]) => ({
        customerId,
        customerName: invoices.find((i) => i.customerId === customerId)?.customer?.fullName || 'Unknown',
        ...data,
      })),
      technicianProfit: 0, // Not implemented yet
      monthlyProfit: Array.from(monthlyProfit.entries()).map(([month, data]) => ({
        month,
        ...data,
      })),
    };
  }

  // ============================================
  // CONSOLIDATED REPORTS (Unified Reports)
  // ============================================

  async getConsolidatedSalesReport(tenantId: string) {
    // Get sales by branch
    const branches = await (prisma as any).branch.findMany({
      where: { tenantId },
    });

    const report = await Promise.all(
      branches.map(async (branch: any) => {
        const invoices = await prisma.invoice.findMany({
          where: {
            tenantId,
            branchId: branch.id,
            status: 'ISSUED',
          },
        });

        const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalSYP), 0);

        return {
          branchId: branch.id,
          branchName: branch.nameAr || branch.name,
          totalSales,
          invoiceCount: invoices.length,
        };
      })
    );

    return report;
  }

  async getConsolidatedProfitabilityReport(tenantId: string) {
    // Get profitability by branch
    const branches = await (prisma as any).branch.findMany({
      where: { tenantId },
    });

    const report = await Promise.all(
      branches.map(async (branch: any) => {
        const invoices = await prisma.invoice.findMany({
          where: {
            tenantId,
            branchId: branch.id,
            status: 'ISSUED',
          },
          include: {
            items: true,
          },
        });

        let totalRevenue = 0;
        let totalCost = 0;

        // Get all service parts for cost calculation
        const serviceIds = invoices.flatMap((i: any) => i.items.map((item: any) => item.serviceId)).filter((id): id is string => id != null);
        const serviceParts = await (prisma as any).servicePart.findMany({
          where: { serviceId: { in: serviceIds } },
          include: { part: true },
        });

        invoices.forEach((invoice: any) => {
          invoice.items.forEach((item: any) => {
            totalRevenue += Number(item.priceSYP);
            const parts = serviceParts.filter((sp: any) => sp.serviceId === item.serviceId);
            parts.forEach((sp: any) => {
              totalCost += Number(sp.part.costSYP) * sp.quantity;
            });
          });
        });

        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
          branchId: branch.id,
          branchName: branch.nameAr || branch.name,
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
        };
      })
    );

    return report;
  }

  async getConsolidatedInventoryReport(tenantId: string) {
    // Get inventory by branch (using warehouses since parts don't have branchId directly)
    const branches = await (prisma as any).branch.findMany({
      where: { tenantId },
      include: {
        warehouses: true,
      },
    });

    const report = await Promise.all(
      branches.map(async (branch: any) => {
        const warehouseIds = branch.warehouses.map((w: any) => w.id);
        
        // Get parts through inventory transactions to find parts in branch warehouses
        const inventoryTransactions = await prisma.inventoryTransaction.findMany({
          where: {
            tenantId,
            warehouseId: { in: warehouseIds },
          },
          include: {
            part: true,
          },
        });

        // Aggregate by part
        const partMap = new Map<string, { quantity: number; costSYP: number; minQuantity: number }>();
        inventoryTransactions.forEach((it: any) => {
          const partId = it.partId;
          const existing = partMap.get(partId) || { quantity: 0, costSYP: 0, minQuantity: it.part.minQuantity || 5 };
          const quantityChange = it.type === 'IN' ? it.quantity : -it.quantity;
          existing.quantity += quantityChange;
          existing.costSYP = Number(it.part.costSYP);
          partMap.set(partId, existing);
        });

        const parts = Array.from(partMap.values());
        const inventoryValue = parts.reduce((sum, p) => sum + p.costSYP * p.quantity, 0);
        const totalParts = parts.reduce((sum, p) => sum + p.quantity, 0);
        const lowStockCount = parts.filter((p) => p.quantity < p.minQuantity).length;

        return {
          branchId: branch.id,
          branchName: branch.nameAr || branch.name,
          inventoryValue,
          totalParts,
          lowStockCount,
        };
      })
    );

    return report;
  }

  async getConsolidatedExpensesReport(tenantId: string) {
    // Get expenses by branch from journal entries
    const branches = await (prisma as any).branch.findMany({
      where: { tenantId },
    });

    const report = await Promise.all(
      branches.map(async (branch: any) => {
        // Get expense accounts
        const expenseAccounts = await prisma.account.findMany({
          where: {
            tenantId,
            accountType: 'EXPENSE',
          },
        });

        const accountIds = expenseAccounts.map((a) => a.id);

        // Get journal lines for expense accounts (filter by branch through related records)
        const journalLines = await prisma.journalLine.findMany({
          where: {
            accountId: { in: accountIds },
            entry: {
              tenantId,
            },
          },
          include: {
            account: true,
            entry: true,
          },
        });

        // Filter journal entries by branchId from the entry
        const branchJournalLines = journalLines.filter((jl: any) => jl.entry.branchId === branch.id);

        const totalExpenses = branchJournalLines.reduce((sum, line) => sum + Number(line.debitSYP) - Number(line.creditSYP), 0);

        return {
          branchId: branch.id,
          branchName: branch.nameAr || branch.name,
          totalExpenses,
        };
      })
    );

    return report;
  }

  async getConsolidatedMembershipsReport(tenantId: string) {
    // Get memberships by branch
    const branches = await (prisma as any).branch.findMany({
      where: { tenantId },
    });

    const report = await Promise.all(
      branches.map(async (branch: any) => {
        const now = new Date();
        
        const memberships = await (prisma as any).customerMembership.findMany({
          where: {
            tenantId,
            branchId: branch.id,
          },
        });

        const activeMemberships = memberships.filter((m: any) => m.validUntil && m.validUntil > now).length;
        const expiredMemberships = memberships.filter((m: any) => !m.validUntil || m.validUntil <= now).length;

        return {
          branchId: branch.id,
          branchName: branch.nameAr || branch.name,
          activeMemberships,
          expiredMemberships,
          totalMemberships: memberships.length,
        };
      })
    );

    return report;
  }
}
