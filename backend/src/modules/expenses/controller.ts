import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ExpenseManagementService } from './expense-management.service';
import { createJournalEntry, getAccountIdByCode, DEFAULT_ACCOUNT_CODES } from '../accounting/automatic-journal-entries';
import settingsService from '../../services/settings.service';
import { AuthRequest } from '../../shared/middlewares/auth';

// Expense categories → chart-of-accounts code. Supports Arabic and English keys.
// Category 'EQUIPMENT' is an asset purchase (machinery/tools), not an expense —
// its debit posts to 1230 instead of an expense account.
const EXPENSE_CATEGORY_ACCOUNTS: Record<string, string> = {
  'UTILITIES': '6300',
  'Utilities': '6300',
  'كهرباء وماء': '6300',
  'INTERNET': '6800',
  'إنترنت واتصالات': '6800',
  'RENT': '6200',
  'Rent': '6200',
  'إيجار': '6200',
  'SALARIES': '6110',
  'Salaries': '6110',
  'رواتب': '6110',
  'SUPPLIES': '6900',
  'Supplies': '6900',
  'مستلزمات': '6900',
  'BUFFET': '6900',
  'بوفيه': '6900',
  'MAINTENANCE': '6500',
  'Maintenance': '6500',
  'صيانة': '6500',
  'EQUIPMENT': '1230',
  'معدات': '1230',
  'MARKETING': '6700',
  'Marketing': '6700',
  'تسويق': '6700',
  'TRANSPORTATION': '6600',
  'Transportation': '6600',
  'نقل ووقود': '6600',
  'JOB_PURCHASE': '5100',
  'مشتريات مهمة': '5100',
  'OTHER': '6900',
  'أخرى': '6900',
};

export class ExpensesController {
  private service = new ExpenseManagementService();

  async createExpense(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { category, description, amountSYP, amountUSD, expenseDate, paymentMethod, reference, notes, bookingId, isRecurring, recurringFrequency } = req.body;
      if (!category || !description || !expenseDate || !paymentMethod) {
        res.status(400).json({ error: 'category, description, expenseDate and paymentMethod are required' });
        return;
      }
      if (bookingId) {
        const booking = await prisma.booking.findFirst({ where: { id: bookingId, tenantId }, select: { id: true } });
        if (!booking) {
          res.status(400).json({ error: 'Booking not found' });
          return;
        }
      }

      // Enter the amount in the currency actually paid; derive the other side.
      const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
      const usd = Number(amountUSD) || 0;
      const syp = Number(amountSYP) || 0;
      let finalSYP: number, finalUSD: number;
      if (usd > 0 && syp <= 0) {
        finalUSD = usd;
        finalSYP = Math.round(usd * exchangeRate * 100) / 100;
      } else if (syp > 0) {
        finalSYP = syp;
        finalUSD = Math.round((syp / exchangeRate) * 100) / 100;
      } else {
        res.status(400).json({ error: 'Amount is required (SYP or USD)' });
        return;
      }

      const accountCode = EXPENSE_CATEGORY_ACCOUNTS[category] || '6900';
      const isCash = paymentMethod === 'CASH' || paymentMethod === 'كاش';
      const userId = req.user!.id;

      // Expense + journal entry in ONE transaction — either both post or neither does.
      const expense = await prisma.$transaction(async (tx) => {
        const created = await this.service.createExpense(
          tenantId, category, description, finalSYP, finalUSD, new Date(expenseDate),
          paymentMethod, reference, notes, isRecurring, recurringFrequency, bookingId, tx
        );

        const debitAccountId = await getAccountIdByCode(tenantId, accountCode, tx);
        const creditAccountId = await getAccountIdByCode(
          tenantId,
          isCash ? DEFAULT_ACCOUNT_CODES.CASH : DEFAULT_ACCOUNT_CODES.BANK,
          tx
        );
        if (!debitAccountId || !creditAccountId) {
          throw new Error('Required accounts not found. Please set up chart of accounts.');
        }

        await createJournalEntry(
          tenantId,
          new Date(expenseDate),
          `Expense: ${description} / مصروف: ${description}`,
          reference || created.id,
          'EXPENSE',
          created.id,
          userId,
          [
            {
              accountId: debitAccountId,
              debitSYP: finalSYP,
              debitUSD: finalUSD,
              creditSYP: 0,
              creditUSD: 0,
              description: `${category}: ${description}`,
            },
            {
              accountId: creditAccountId,
              debitSYP: 0,
              debitUSD: 0,
              creditSYP: finalSYP,
              creditUSD: finalUSD,
              description: `Payment via ${isCash ? 'CASH' : 'BANK'}`,
            },
          ],
          tx
        );

        return created;
      });

      res.status(201).json(expense);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create expense' });
    }
  }

  async getExpense(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const expense = await this.service.getExpense(id);
      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense' });
    }
  }

  async getExpenses(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { category, bookingId, startDate, endDate, limit, offset } = req.query;
      const expenses = await this.service.getExpenses(
        tenantId,
        category as string | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0,
        bookingId as string | undefined
      );
      res.json({ success: true, data: expenses });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }

  async getExpenseSummary(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;
      const summary = await this.service.getExpenseSummary(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense summary' });
    }
  }

  async getExpenseCategories(req: Request, res: Response) {
    try {
      const categories = await this.service.getExpenseCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
  }

  async getExpenseTrend(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { days } = req.query;
      const trend = await this.service.getExpenseTrend(
        tenantId,
        parseInt(days as string) || 30
      );
      res.json({ success: true, data: trend });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense trend' });
    }
  }

  async approveExpense(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const expense = await this.service.approveExpense(id, req.user!.id);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve expense' });
    }
  }

  async deleteExpense(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteExpense(id, req.user!.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to delete expense' });
    }
  }

  async getExpenseReport(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate, groupBy } = req.query;
      const report = await this.service.getExpenseReport(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        groupBy as 'category' | 'paymentMethod' | 'date'
      );
      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense report' });
    }
  }
}
