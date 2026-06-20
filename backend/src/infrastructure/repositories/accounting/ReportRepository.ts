import { IReportRepository } from '../../../application/accounting/interfaces/IReportRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';

export class ReportRepository implements IReportRepository {
  async getTrialBalance(asOfDate: Date): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const accounts = await prisma.account.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });
      
      const trialBalance = [];
      for (const account of accounts) {
        const debitTotal = await prisma.journalLine.aggregate({
          where: {
            accountId: account.id,
            entry: {
              entryDate: { lte: asOfDate },
            },
          },
          _sum: { debitSYP: true },
        });
        
        const creditTotal = await prisma.journalLine.aggregate({
          where: {
            accountId: account.id,
            entry: {
              entryDate: { lte: asOfDate },
            },
          },
          _sum: { creditSYP: true },
        });
        
        const debit = Number(debitTotal._sum.debitSYP || 0);
        const credit = Number(creditTotal._sum.creditSYP || 0);
        const balance = debit - credit;
        
        trialBalance.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.nameEn,
          accountType: account.accountType,
          debit,
          credit,
          balance,
        });
      }
      
      return trialBalance;
    } catch (error) {
      throw new DatabaseError('Failed to get trial balance', error);
    }
  }

  async getIncomeStatement(startDate: Date, endDate: Date): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      
      const revenue = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'REVENUE' },
          entry: { entryDate: { gte: startDate, lte: endDate } },
        },
        _sum: { creditSYP: true, debitSYP: true },
      });
      
      const cogs = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'COGS' },
          entry: { entryDate: { gte: startDate, lte: endDate } },
        },
        _sum: { debitSYP: true, creditSYP: true },
      });
      
      const expenses = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'EXPENSE' },
          entry: { entryDate: { gte: startDate, lte: endDate } },
        },
        _sum: { debitSYP: true, creditSYP: true },
      });
      
      const totalRevenue = Number(revenue._sum.creditSYP || 0) - Number(revenue._sum.debitSYP || 0);
      const totalCOGS = Number(cogs._sum.debitSYP || 0) - Number(cogs._sum.creditSYP || 0);
      const totalOperatingExpenses = Number(expenses._sum.debitSYP || 0) - Number(expenses._sum.creditSYP || 0);
      const grossProfit = totalRevenue - totalCOGS;
      const netIncome = grossProfit - totalOperatingExpenses;
      
      return {
        startDate,
        endDate,
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalOperatingExpenses,
        netIncome,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get income statement', error);
    }
  }

  async getBalanceSheet(asOfDate: Date): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      
      const assets = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'ASSET' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { debitSYP: true, creditSYP: true },
      });
      
      const liabilities = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'LIABILITY' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { creditSYP: true, debitSYP: true },
      });
      
      const equity = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'EQUITY' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { creditSYP: true, debitSYP: true },
      });
      
      // Retained Earnings = cumulative Revenue - cumulative (COGS + Expenses) up to asOfDate
      const revenue = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'REVENUE' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { creditSYP: true, debitSYP: true },
      });
      const cogs = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'COGS' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { debitSYP: true, creditSYP: true },
      });
      const expenses = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'EXPENSE' },
          entry: { entryDate: { lte: asOfDate } },
        },
        _sum: { debitSYP: true, creditSYP: true },
      });
      const totalRevenue = Number(revenue._sum.creditSYP || 0) - Number(revenue._sum.debitSYP || 0);
      const totalCOGS = Number((cogs._sum?.debitSYP || 0)) - Number((cogs._sum?.creditSYP || 0));
      const totalExpenses = Number((expenses._sum?.debitSYP || 0)) - Number((expenses._sum?.creditSYP || 0));
      const retainedEarnings = totalRevenue - totalCOGS - totalExpenses;
      
      const totalAssets = Number(assets._sum.debitSYP || 0) - Number(assets._sum.creditSYP || 0);
      const totalLiabilities = Number(liabilities._sum.creditSYP || 0) - Number(liabilities._sum.debitSYP || 0);
      const totalEquity = Number(equity._sum.creditSYP || 0) - Number(equity._sum.debitSYP || 0) + retainedEarnings;
      
      return {
        asOfDate,
        totalAssets,
        totalLiabilities,
        totalEquity,
        retainedEarnings,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get balance sheet', error);
    }
  }

  async getCashFlowSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();

      // Cash inflow: Debit to cash/bank accounts (code starts with 1)
      const cashInflow = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'ASSET', code: { startsWith: '1' } },
          entry: { entryDate: { gte: startDate, lte: endDate } },
          debitSYP: { gt: 0 },
        },
        _sum: { debitSYP: true },
      });

      // Cash outflow: Credit to cash/bank accounts (code starts with 1)
      const cashOutflow = await prisma.journalLine.aggregate({
        where: {
          account: { accountType: 'ASSET', code: { startsWith: '1' } },
          entry: { entryDate: { gte: startDate, lte: endDate } },
          creditSYP: { gt: 0 },
        },
        _sum: { creditSYP: true },
      });

      const totalInflow = Number(cashInflow._sum.debitSYP || 0);
      const totalOutflow = Number(cashOutflow._sum.creditSYP || 0);
      const netCashFlow = totalInflow - totalOutflow;

      return {
        startDate,
        endDate,
        totalInflow,
        totalOutflow,
        netCashFlow,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get cash flow summary', error);
    }
  }

  async getSalesByService(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const bookingServices = await prisma.bookingService.findMany({
        where: {
          booking: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        include: {
          service: true,
        },
      });
      
      const serviceSales = new Map();
      for (const bs of bookingServices) {
        const serviceName = bs.service.nameEn || bs.service.name;
        const current = serviceSales.get(serviceName) || { count: 0, total: 0 };
        serviceSales.set(serviceName, {
          count: current.count + 1,
          total: current.total + Number(bs.priceSYP),
        });
      }
      
      return Array.from(serviceSales.entries()).map(([serviceName, data]) => ({
        serviceName,
        count: data.count,
        total: data.total,
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get sales by service', error);
    }
  }

  async getTopCustomers(limit: number): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();

      // Get journal lines for AR accounts (debit = customer purchases)
      const arJournalLines = await prisma.journalLine.findMany({
        where: {
          account: { accountType: 'ASSET' },
          debitSYP: { gt: 0 },
          entry: { sourceType: 'INVOICE' },
        },
        include: {
          entry: true,
        },
      });

      // Aggregate by customer (from sourceId which is invoiceId)
      const customerSpending = new Map<string, { totalSpent: number; invoiceCount: number }>();

      for (const line of arJournalLines) {
        const invoiceId = line.entry.sourceId;
        if (!invoiceId) continue;

        const invoice = await prisma.invoice.findUnique({
          where: { id: invoiceId },
          select: { customerId: true },
        });

        if (invoice && invoice.customerId) {
          const existing = customerSpending.get(invoice.customerId) || { totalSpent: 0, invoiceCount: 0 };
          customerSpending.set(invoice.customerId, {
            totalSpent: existing.totalSpent + Number(line.debitSYP),
            invoiceCount: existing.invoiceCount + 1,
          });
        }
      }

      // Get customer details
      const customerIds = Array.from(customerSpending.keys());
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
      });

      return customers
        .map(customer => ({
          customerId: customer.id,
          customerName: customer.fullName,
          totalInvoices: customerSpending.get(customer.id)?.invoiceCount || 0,
          totalSpent: customerSpending.get(customer.id)?.totalSpent || 0,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (error) {
      throw new DatabaseError('Failed to get top customers', error);
    }
  }

  async getTopSuppliers(limit: number): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();

      // Get journal lines for AP accounts (credit = supplier purchases)
      const apJournalLines = await prisma.journalLine.findMany({
        where: {
          account: { accountType: 'LIABILITY' },
          creditSYP: { gt: 0 },
          entry: { sourceType: 'GRN' },
        },
        include: {
          entry: true,
        },
      });

      // Aggregate by supplier (from sourceId which is GRN ID)
      const supplierPurchases = new Map<string, { totalPurchased: number; orderCount: number }>();

      for (const line of apJournalLines) {
        const grnId = line.entry.sourceId;
        if (!grnId) continue;

        const grn = await prisma.goodsReceiptNote.findUnique({
          where: { id: grnId },
          select: { supplierId: true },
        });

        if (grn && grn.supplierId) {
          const existing = supplierPurchases.get(grn.supplierId) || { totalPurchased: 0, orderCount: 0 };
          supplierPurchases.set(grn.supplierId, {
            totalPurchased: existing.totalPurchased + Number(line.creditSYP),
            orderCount: existing.orderCount + 1,
          });
        }
      }

      // Get supplier details
      const supplierIds = Array.from(supplierPurchases.keys());
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
      });

      return suppliers
        .map(supplier => ({
          supplierId: supplier.id,
          supplierName: supplier.name,
          totalOrders: supplierPurchases.get(supplier.id)?.orderCount || 0,
          totalPurchased: supplierPurchases.get(supplier.id)?.totalPurchased || 0,
        }))
        .sort((a, b) => b.totalPurchased - a.totalPurchased)
        .slice(0, limit);
    } catch (error) {
      throw new DatabaseError('Failed to get top suppliers', error);
    }
  }

  async getInventoryValuation(): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const parts = await prisma.part.findMany({
        where: { isActive: true },
      });
      
      return parts.map(part => ({
        partId: part.id,
        partNumber: part.partNumber,
        partName: part.nameEn || part.name,
        quantity: part.quantity,
        unitCost: Number(part.costSYP),
        totalValue: part.quantity * Number(part.costSYP),
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get inventory valuation', error);
    }
  }

  async getProfitPerBooking(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();

      // Get bookings in the date range
      const bookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          invoices: true,
        },
      });

      const profitData = [];

      for (const booking of bookings) {
        // Revenue: Sum of credits to revenue accounts for this booking's invoices
        const revenueJournalLines = await prisma.journalLine.findMany({
          where: {
            account: { accountType: 'REVENUE' },
            entry: {
              entryDate: { gte: startDate, lte: endDate },
              sourceType: 'INVOICE',
              sourceId: { in: booking.invoices.map(inv => inv.id) },
            },
          },
        });

        const revenue = revenueJournalLines.reduce((sum, line) => sum + Number(line.creditSYP || 0), 0);

        // Cost: Sum of debits to COGS accounts for this booking's inventory transactions
        // First get inventory transactions related to this booking's invoices
        // Note: invoiceId field may not exist in schema - fallback to reference matching
        const inventoryTransactions = await prisma.inventoryTransaction.findMany({
          where: {
            type: 'CONSUMPTION',
            // Try to match by reference if invoiceId is not available
            reference: { in: booking.invoices.map(inv => inv.invoiceNumber) },
          },
        });

        // Get COGS journal entries for these transactions
        const costJournalLines = await prisma.journalLine.findMany({
          where: {
            account: { accountType: 'EXPENSE' },
            entry: {
              entryDate: { gte: startDate, lte: endDate },
              sourceType: 'INVENTORY_TRANSACTION',
              sourceId: { in: inventoryTransactions.map(t => t.id) },
            },
          },
        });

        const cost = costJournalLines.reduce((sum, line) => sum + Number(line.debitSYP || 0), 0);

        const profit = revenue - cost;

        profitData.push({
          bookingId: booking.id,
          bookingDate: booking.createdAt,
          customerId: booking.customerId,
          revenue,
          cost,
          profit,
        });
      }

      return profitData;
    } catch (error) {
      throw new DatabaseError('Failed to get profit per booking', error);
    }
  }
}
