import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AccountRepository } from '../../../infrastructure/repositories/accounting/AccountRepository';
import { JournalEntryRepository } from '../../../infrastructure/repositories/accounting/JournalEntryRepository';
import { CustomerAccountRepository } from '../../../infrastructure/repositories/accounting/CustomerAccountRepository';
import { SupplierAccountRepository } from '../../../infrastructure/repositories/accounting/SupplierAccountRepository';
import { PaymentRepository } from '../../../infrastructure/repositories/accounting/PaymentRepository';
import { ReportRepository } from '../../../infrastructure/repositories/accounting/ReportRepository';
import prisma from '../../../config/database';
import { Logger } from '../../../infrastructure/logging/logger';

export class AccountingController {
  private accountRepository: AccountRepository;
  private journalEntryRepository: JournalEntryRepository;
  private customerAccountRepository: CustomerAccountRepository;
  private supplierAccountRepository: SupplierAccountRepository;
  private paymentRepository: PaymentRepository;
  private reportRepository: ReportRepository;

  constructor() {
    this.accountRepository = new AccountRepository();
    this.journalEntryRepository = new JournalEntryRepository();
    this.customerAccountRepository = new CustomerAccountRepository();
    this.supplierAccountRepository = new SupplierAccountRepository();
    this.paymentRepository = new PaymentRepository();
    this.reportRepository = new ReportRepository();
  }

  // Account endpoints
  async createAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code, nameAr, nameEn, parentId, accountType, balanceSYP, balanceUSD } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const account = await this.accountRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        code,
        nameAr,
        nameEn,
        parentId,
        accountType,
        balanceSYP,
        balanceUSD,
      });

      ErrorMiddleware.success(res, account, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create account', 500);
    }
  }

  async listAccounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const accounts = await this.accountRepository.list(tenantId);

      ErrorMiddleware.success(res, accounts, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list accounts', 500);
    }
  }

  async getAccountTree(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const tree = await this.accountRepository.getTree(tenantId);

      ErrorMiddleware.success(res, tree, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get account tree', 500);
    }
  }

  // Journal Entry endpoints
  async createJournalEntry(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { date, reference, description, lines } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const journalEntry = await this.journalEntryRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        date,
        reference,
        description,
        lines,
      });

      ErrorMiddleware.success(res, journalEntry, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create journal entry', 500);
    }
  }

  async listJournalEntries(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      
      // Default to last 30 days if no dates provided
      const start = startDate 
        ? new Date(startDate as string) 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate 
        ? new Date(endDate as string) 
        : new Date();

      const journalEntries = await this.journalEntryRepository.listByDateRange(start, end);

      ErrorMiddleware.success(res, journalEntries, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list journal entries', 500);
    }
  }

  // Customer Account endpoints
  async getCustomerBalance(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const balance = await this.customerAccountRepository.getBalance(customerId);

      ErrorMiddleware.success(res, { balance }, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get customer balance', 500);
    }
  }

  async getCustomerStatement(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const statement = await this.customerAccountRepository.getStatement(customerId);

      ErrorMiddleware.success(res, statement, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get customer statement', 500);
    }
  }

  // Supplier Account endpoints
  async getSupplierBalance(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const balance = await this.supplierAccountRepository.getBalance(supplierId);

      ErrorMiddleware.success(res, { balance }, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get supplier balance', 500);
    }
  }

  async getSupplierStatement(req: Request, res: Response): Promise<void> {
    try {
      const { supplierId } = req.params;
      const statement = await this.supplierAccountRepository.getStatement(supplierId);

      ErrorMiddleware.success(res, statement, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get supplier statement', 500);
    }
  }

  // Payment endpoints
  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { invoiceId, amountSYP, amountUSD, paymentDate, paymentMethod, reference, notes } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const payment = await this.paymentRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        invoiceId,
        amountSYP,
        amountUSD,
        paymentDate,
        paymentMethod,
        reference,
        notes,
      });

      ErrorMiddleware.success(res, payment, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create payment', 500);
    }
  }

  async listPaymentsByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const payments = await this.paymentRepository.listByCustomer(customerId);

      ErrorMiddleware.success(res, payments, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list payments', 500);
    }
  }

  // Report endpoints
  async getTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { asOfDate } = req.query;
      const trialBalance = await this.reportRepository.getTrialBalance(new Date(asOfDate as string));

      ErrorMiddleware.success(res, trialBalance, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get trial balance', 500);
    }
  }

  async getIncomeStatement(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const incomeStatement = await this.reportRepository.getIncomeStatement(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      ErrorMiddleware.success(res, incomeStatement, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get income statement', 500);
    }
  }

  async getBalanceSheet(req: Request, res: Response): Promise<void> {
    try {
      const { asOfDate } = req.query;
      const balanceSheet = await this.reportRepository.getBalanceSheet(new Date(asOfDate as string));

      ErrorMiddleware.success(res, balanceSheet, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to get balance sheet', 500);
    }
  }

  // Batch create accounts
  async createManyAccounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const { accounts } = req.body;

      if (!Array.isArray(accounts) || accounts.length === 0) {
        ErrorMiddleware.error(res, 'VALIDATION_ERROR', 'Accounts array is required', 400);
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const acc of accounts) {
          const a = await tx.account.create({
            data: {
              tenantId,
              code: acc.code,
              nameAr: acc.nameAr || acc.name,
              nameEn: acc.nameEn || acc.name,
              parentId: acc.parentId || null,
              accountType: acc.accountType || 'ASSET',
              balanceSYP: acc.balanceSYP || 0,
              balanceUSD: acc.balanceUSD || 0,
            },
          });
          created.push(a);
        }
        return created;
      }, {
        timeout: 30000,
      });

      ErrorMiddleware.success(res, { count: result.length, accounts: result }, 201);
    } catch (error) {
      Logger.error('Batch create accounts error:', error);
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create accounts', 500);
    }
  }
}
