import { AccountType } from '@prisma/client';

// ============================================
// BALANCE SHEET
// ============================================

export interface BalanceSheetRequest {
  fromDate: Date;
  toDate: Date;
  currency?: string;
}

export interface BalanceSheetAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  accountType: AccountType;
  balance: number;
  currency: string;
}

export interface BalanceSheetSection {
  sectionType: 'ASSETS' | 'LIABILITIES' | 'EQUITY';
  sectionName: string;
  sectionNameAr: string;
  accounts: BalanceSheetAccount[];
  total: number;
  currency: string;
}

export interface BalanceSheetResponse {
  reportDate: Date;
  currency: string;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  generatedAt: Date;
}

// ============================================
// PROFIT & LOSS
// ============================================

export interface ProfitLossRequest {
  fromDate: Date;
  toDate: Date;
  currency?: string;
}

export interface ProfitLossAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  accountType: AccountType;
  amount: number;
  currency: string;
}

export interface ProfitLossSection {
  sectionType: 'REVENUE' | 'COGS' | 'EXPENSE';
  sectionName: string;
  sectionNameAr: string;
  accounts: ProfitLossAccount[];
  total: number;
  currency: string;
}

export interface ProfitLossResponse {
  fromDate: Date;
  toDate: Date;
  currency: string;
  revenue: ProfitLossSection;
  cogs: ProfitLossSection;
  grossProfit: number;
  expenses: ProfitLossSection;
  netProfit: number;
  netProfitMargin: number;
  generatedAt: Date;
}

// ============================================
// CASH FLOW
// ============================================

export interface CashFlowRequest {
  fromDate: Date;
  toDate: Date;
  currency?: string;
}

export interface CashFlowItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: 'OPERATING' | 'INVESTING' | 'FINANCING';
  reference?: string;
  referenceType?: string;
}

export interface CashFlowSection {
  sectionType: 'OPERATING' | 'INVESTING' | 'FINANCING';
  sectionName: string;
  sectionNameAr: string;
  inflows: CashFlowItem[];
  outflows: CashFlowItem[];
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  currency: string;
}

export interface CashFlowResponse {
  fromDate: Date;
  toDate: Date;
  currency: string;
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  generatedAt: Date;
}

// ============================================
// TRIAL BALANCE
// ============================================

export interface TrialBalanceRequest {
  fromDate: Date;
  toDate: Date;
  currency?: string;
}

export interface TrialBalanceAccount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  accountType: AccountType;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  balanceType: 'DEBIT' | 'CREDIT';
  currency: string;
}

export interface TrialBalanceResponse {
  fromDate: Date;
  toDate: Date;
  currency: string;
  accounts: TrialBalanceAccount[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  difference: number;
  generatedAt: Date;
}

// ============================================
// AGED RECEIVABLES
// ============================================

export interface AgedReceivablesRequest {
  asOfDate: Date;
  currency?: string;
}

export interface AgedReceivableCustomer {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalOutstanding: number;
  currency: string;
  agingBuckets: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
  };
  invoices: AgedReceivableInvoice[];
}

export interface AgedReceivableInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  daysOverdue: number;
  agingBucket: 'CURRENT' | '1_30' | '31_60' | '61_90' | 'OVER_90';
  currency: string;
}

export interface AgedReceivablesResponse {
  asOfDate: Date;
  currency: string;
  customers: AgedReceivableCustomer[];
  totalOutstanding: number;
  agingSummary: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
  };
  generatedAt: Date;
}

// ============================================
// AGED PAYABLES
// ============================================

export interface AgedPayablesRequest {
  asOfDate: Date;
  currency?: string;
}

export interface AgedPayableSupplier {
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  totalOutstanding: number;
  currency: string;
  agingBuckets: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
  };
  purchaseOrders: AgedPayablePurchaseOrder[];
}

export interface AgedPayablePurchaseOrder {
  purchaseOrderId: string;
  orderNumber: string;
  orderDate: Date;
  dueDate: Date;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  daysOverdue: number;
  agingBucket: 'CURRENT' | '1_30' | '31_60' | '61_90' | 'OVER_90';
  currency: string;
}

export interface AgedPayablesResponse {
  asOfDate: Date;
  currency: string;
  suppliers: AgedPayableSupplier[];
  totalOutstanding: number;
  agingSummary: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    daysOver90: number;
  };
  generatedAt: Date;
}

// ============================================
// EXPORT TYPES
// ============================================

export interface ExportRequest {
  fromDate?: Date;
  toDate?: Date;
  asOfDate?: Date;
  format: 'PDF' | 'EXCEL';
  currency?: string;
}

export interface ExportResponse {
  success: boolean;
  data?: Buffer;
  filename: string;
  contentType: string;
  error?: string;
}
