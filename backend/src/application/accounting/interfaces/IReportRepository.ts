export interface IReportRepository {
  getTrialBalance(asOfDate: Date): Promise<any[]>;
  getIncomeStatement(startDate: Date, endDate: Date): Promise<any>;
  getBalanceSheet(asOfDate: Date): Promise<any>;
  getCashFlowSummary(startDate: Date, endDate: Date): Promise<any>;
  getSalesByService(startDate: Date, endDate: Date): Promise<any[]>;
  getTopCustomers(limit: number): Promise<any[]>;
  getTopSuppliers(limit: number): Promise<any[]>;
  getInventoryValuation(): Promise<any[]>;
  getProfitPerBooking(startDate: Date, endDate: Date): Promise<any[]>;
}
