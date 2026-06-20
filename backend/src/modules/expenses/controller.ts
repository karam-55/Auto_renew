import { Request, Response } from 'express';
import { ExpenseManagementService } from './expense-management.service';
import { createExpenseJournalEntry, getAccountIdByCode } from '../accounting/automatic-journal-entries';

const EXPENSE_CATEGORY_ACCOUNTS: Record<string, string> = {
  'Utilities': 'UTILITIES_EXPENSE',
  'Rent': 'RENT_EXPENSE',
  'Salaries': 'PAYROLL_EXPENSE',
  'Supplies': 'SUPPLIES_EXPENSE',
  'Maintenance': 'SUPPLIES_EXPENSE',
  'Marketing': 'SUPPLIES_EXPENSE',
  'Transportation': 'SUPPLIES_EXPENSE',
  'Insurance': 'SUPPLIES_EXPENSE',
};

export class ExpensesController {
  private service = new ExpenseManagementService();

  async createExpense(req: Request, res: Response) {
    try {
      const { tenantId, category, description, amountSYP, amountUSD, expenseDate, paymentMethod, reference, notes, isRecurring, recurringFrequency } = req.body;
      const expense = await this.service.createExpense(
        tenantId,
        category,
        description,
        amountSYP,
        amountUSD,
        new Date(expenseDate),
        paymentMethod,
        reference,
        notes,
        isRecurring,
        recurringFrequency
      );

      // Create automatic journal entry for the expense
      try {
        const expenseAccountType = EXPENSE_CATEGORY_ACCOUNTS[category] || 'SUPPLIES_EXPENSE';
        await createExpenseJournalEntry(
          tenantId,
          expenseAccountType as any,
          amountSYP,
          amountUSD || 0,
          description || `Expense: ${category}`,
          paymentMethod === 'CASH' || paymentMethod === 'كاش' ? 'CASH' : 'BANK',
          reference || expense.id,
          'EXPENSE',
          expense.id,
          req.body.createdById || null
        );
      } catch (journalError: any) {
        // Log but don't fail the expense creation
        console.warn('Failed to create journal entry for expense:', journalError.message);
      }

      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create expense' });
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

  async getExpenses(req: Request, res: Response) {
    try {
      const { tenantId, category, startDate, endDate, limit, offset } = req.query;
      const expenses = await this.service.getExpenses(
        tenantId as string,
        category as string | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }

  async getExpenseSummary(req: Request, res: Response) {
    try {
      const { tenantId, startDate, endDate } = req.query;
      const summary = await this.service.getExpenseSummary(
        tenantId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense summary' });
    }
  }

  async getExpenseCategories(req: Request, res: Response) {
    try {
      const categories = await this.service.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
  }

  async getExpenseTrend(req: Request, res: Response) {
    try {
      const { tenantId, days } = req.query;
      const trend = await this.service.getExpenseTrend(
        tenantId as string,
        parseInt(days as string) || 30
      );
      res.json(trend);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense trend' });
    }
  }

  async approveExpense(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const expense = await this.service.approveExpense(id, approvedBy);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve expense' });
    }
  }

  async deleteExpense(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.service.deleteExpense(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete expense' });
    }
  }

  async getExpenseReport(req: Request, res: Response) {
    try {
      const { tenantId, startDate, endDate, groupBy } = req.query;
      const report = await this.service.getExpenseReport(
        tenantId as string,
        new Date(startDate as string),
        new Date(endDate as string),
        groupBy as 'category' | 'paymentMethod' | 'date'
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expense report' });
    }
  }
}
