// ============================================
// ADVANCED REPORTS TYPES
// ============================================

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  mechanicId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// SALES REPORTS
// ============================================

export interface SalesReport {
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  revenueByService: ServiceRevenue[];
  revenueByMonth: MonthlyRevenue[];
  topCustomers: CustomerRevenue[];
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  invoiceCount: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenueSYP: number;
  revenueUSD: number;
  invoiceCount: number;
}

export interface CustomerRevenue {
  customerId: string;
  customerName: string;
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  invoiceCount: number;
}

// ============================================
// INVENTORY REPORTS
// ============================================

export interface InventoryReport {
  totalParts: number;
  totalValueSYP: number;
  totalValueUSD: number;
  lowStockItems: LowStockItem[];
  fastMovingItems: FastMovingItem[];
  slowMovingItems: SlowMovingItem[];
  inventoryByWarehouse: WarehouseInventory[];
}

export interface LowStockItem {
  partId: string;
  partName: string;
  partCode: string;
  currentQuantity: number;
  minQuantity: number;
  reorderLevel: number;
  unitCostSYP: number;
}

export interface FastMovingItem {
  partId: string;
  partName: string;
  partCode: string;
  totalSold: number;
  totalRevenueSYP: number;
  turnoverRate: number;
}

export interface SlowMovingItem {
  partId: string;
  partName: string;
  partCode: string;
  currentQuantity: number;
  lastSoldDate: Date;
  daysSinceLastSale: number;
  currentValueSYP: number;
}

export interface WarehouseInventory {
  warehouseId: string;
  warehouseName: string;
  totalParts: number;
  totalValueSYP: number;
  totalValueUSD: number;
}

// ============================================
// PERFORMANCE REPORTS
// ============================================

export interface PerformanceReport {
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  averageServiceTime: number;
  mechanicPerformance: MechanicPerformance[];
  servicePerformance: ServicePerformance[];
}

export interface MechanicPerformance {
  mechanicId: string;
  mechanicName: string;
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number;
  averageTime: number;
  totalRevenueSYP: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  averageTime: number;
  totalRevenueSYP: number;
}

// ============================================
// FINANCIAL REPORTS
// ============================================

export interface FinancialReport {
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  totalExpensesSYP: number;
  totalExpensesUSD: number;
  netProfitSYP: number;
  netProfitUSD: number;
  profitMargin: number;
  revenueByPaymentMethod: PaymentMethodRevenue[];
  expensesByCategory: ExpenseCategory[];
  cashFlow: CashFlowEntry[];
}

export interface PaymentMethodRevenue {
  paymentMethod: string;
  totalRevenueSYP: number;
  totalRevenueUSD: number;
  transactionCount: number;
  percentage: number;
}

export interface ExpenseCategory {
  category: string;
  totalAmountSYP: number;
  totalAmountUSD: number;
  percentage: number;
}

export interface CashFlowEntry {
  date: Date;
  inflowSYP: number;
  outflowSYP: number;
  netFlowSYP: number;
  balanceSYP: number;
}

// ============================================
// CUSTOMER INSIGHTS
// ============================================

export interface CustomerInsightsReport {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  averageCustomerValue: number;
  customerSegments: CustomerSegment[];
  churnRiskCustomers: ChurnRiskCustomer[];
  customerLifetimeValue: number;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  averageValue: number;
  totalRevenue: number;
}

export interface ChurnRiskCustomer {
  customerId: string;
  customerName: string;
  lastVisitDate: Date;
  daysSinceLastVisit: number;
  totalVisits: number;
  totalRevenue: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
