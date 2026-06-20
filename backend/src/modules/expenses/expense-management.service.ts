import { Prisma } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Expense Management Service
 * Manages expense tracking and categorization
 * 
 * Handles expense creation, categorization, and reporting
 */

export interface Expense {
  id: string;
  tenantId: string;
  category: string;
  description: string;
  amountSYP: number;
  amountUSD: number;
  expenseDate: Date;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  isRecurring: boolean;
  recurringFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  createdAt: Date;
}

export class ExpenseManagementService {
  /**
   * Create a new expense
   */
  async createExpense(
    tenantId: string,
    category: string,
    description: string,
    amountSYP: number,
    amountUSD: number,
    expenseDate: Date,
    paymentMethod: string,
    reference: string | undefined,
    notes: string | undefined,
    isRecurring: boolean,
    recurringFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined
  ): Promise<Expense> {
    const expense = await prisma.expense.create({
      data: {
        tenantId,
        category,
        description,
        amountSYP,
        amountUSD,
        expenseDate,
        paymentMethod,
        reference,
        notes,
        isRecurring,
        recurringFrequency
      }
    });

    return {
      id: expense.id,
      tenantId: expense.tenantId,
      category: expense.category,
      description: expense.description,
      amountSYP: Number(expense.amountSYP),
      amountUSD: Number(expense.amountUSD || 0),
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || undefined,
      notes: expense.notes || undefined,
      approvedBy: expense.approvedBy || undefined,
      approvedAt: expense.approvedAt || undefined,
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined,
      createdAt: expense.createdAt
    };
  }

  /**
   * Get expense by ID
   */
  async getExpense(expenseId: string): Promise<Expense | null> {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId }
    });

    if (!expense) return null;

    return {
      id: expense.id,
      tenantId: expense.tenantId,
      category: expense.category,
      description: expense.description,
      amountSYP: Number(expense.amountSYP),
      amountUSD: Number(expense.amountUSD || 0),
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || undefined,
      notes: expense.notes || undefined,
      approvedBy: expense.approvedBy || undefined,
      approvedAt: expense.approvedAt || undefined,
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined,
      createdAt: expense.createdAt
    };
  }

  /**
   * Get expenses for a tenant
   */
  async getExpenses(
    tenantId: string,
    category?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0
  ): Promise<Expense[]> {
    const where: any = { tenantId };
    if (category) where.category = category;
    if (startDate && endDate) {
      where.expenseDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      take: limit,
      skip: offset
    });

    return expenses.map((e: any) => ({
      id: e.id,
      tenantId: e.tenantId,
      category: e.category,
      description: e.description,
      amountSYP: Number(e.amountSYP),
      amountUSD: Number(e.amountUSD || 0),
      expenseDate: e.expenseDate,
      paymentMethod: e.paymentMethod,
      reference: e.reference || undefined,
      notes: e.notes || undefined,
      approvedBy: e.approvedBy || undefined,
      approvedAt: e.approvedAt || undefined,
      isRecurring: e.isRecurring,
      recurringFrequency: e.recurringFrequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined,
      createdAt: e.createdAt
    }));
  }

  /**
   * Get expense summary for dashboard
   */
  async getExpenseSummary(
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalExpenses: number;
    totalAmountSYP: number;
    totalAmountUSD: number;
    expensesByCategory: Record<string, number>;
    recurringExpenses: number;
    pendingApproval: number;
  }> {
    const where: any = { tenantId };
    if (startDate && endDate) {
      where.expenseDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const expenses = await prisma.expense.findMany({ where });

    const totalAmountSYP = expenses.reduce((sum: number, e: any) => sum + Number(e.amountSYP || 0), 0);
    const totalAmountUSD = expenses.reduce((sum: number, e: any) => sum + Number(e.amountUSD || 0), 0);

    const expensesByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += Number(expense.amountSYP || 0);
    }

    const recurringExpenses = expenses.filter((e: any) => e.isRecurring).length;
    const pendingApproval = expenses.filter((e: any) => !e.approvedBy).length;

    return {
      totalExpenses: expenses.length,
      totalAmountSYP,
      totalAmountUSD,
      expensesByCategory,
      recurringExpenses,
      pendingApproval
    };
  }

  /**
   * Get expense categories
   */
  async getExpenseCategories(): Promise<Array<{
    id: string;
    name: string;
    nameAr: string;
    description: string;
  }>> {
    return [
      {
        id: 'cat-1',
        name: 'Utilities',
        nameAr: 'المرافق',
        description: 'Electricity, water, gas, and other utilities'
      },
      {
        id: 'cat-2',
        name: 'Rent',
        nameAr: 'الإيجار',
        description: 'Office and facility rent'
      },
      {
        id: 'cat-3',
        name: 'Salaries',
        nameAr: 'الرواتب',
        description: 'Employee salaries and wages'
      },
      {
        id: 'cat-4',
        name: 'Supplies',
        nameAr: 'المستلزمات',
        description: 'Office supplies and equipment'
      },
      {
        id: 'cat-5',
        name: 'Maintenance',
        nameAr: 'الصيانة',
        description: 'Equipment and facility maintenance'
      },
      {
        id: 'cat-6',
        name: 'Marketing',
        nameAr: 'التسويق',
        description: 'Marketing and advertising expenses'
      },
      {
        id: 'cat-7',
        name: 'Transportation',
        nameAr: 'النقل',
        description: 'Vehicle and transportation costs'
      },
      {
        id: 'cat-8',
        name: 'Insurance',
        nameAr: 'التأمين',
        description: 'Insurance premiums'
      }
    ];
  }

  /**
   * Get expense trend data
   */
  async getExpenseTrend(
    tenantId: string,
    days: number = 30
  ): Promise<Array<{
    date: string;
    amount: number;
    count: number;
  }>> {
    const trend: Array<{ date: string; amount: number; count: number }> = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // In a real implementation, fetch from database
      trend.push({
        date: dateStr,
        amount: 0,
        count: 0
      });
    }

    return trend;
  }

  /**
   * Approve expense
   */
  async approveExpense(
    expenseId: string,
    approvedBy: string
  ): Promise<Expense> {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        approvedBy,
        approvedAt: new Date()
      }
    });

    return {
      id: expense.id,
      tenantId: expense.tenantId,
      category: expense.category,
      description: expense.description,
      amountSYP: Number(expense.amountSYP),
      amountUSD: Number(expense.amountUSD || 0),
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod,
      reference: expense.reference || undefined,
      notes: expense.notes || undefined,
      approvedBy: expense.approvedBy || undefined,
      approvedAt: expense.approvedAt || undefined,
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined,
      createdAt: expense.createdAt
    };
  }

  /**
   * Delete expense
   */
  async deleteExpense(expenseId: string): Promise<boolean> {
    await prisma.expense.delete({
      where: { id: expenseId }
    });
    return true;
  }

  /**
   * Get expense report
   */
  async getExpenseReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'category' | 'paymentMethod' | 'date'
  ): Promise<{
    totalAmountSYP: number;
    totalAmountUSD: number;
    breakdown: Record<string, number>;
  }> {
    const where = {
      tenantId,
      expenseDate: {
        gte: startDate,
        lte: endDate
      }
    };

    const expenses = await prisma.expense.findMany({ where });

    const totalAmountSYP = expenses.reduce((sum: number, e: any) => sum + Number(e.amountSYP || 0), 0);
    const totalAmountUSD = expenses.reduce((sum: number, e: any) => sum + Number(e.amountUSD || 0), 0);

    const breakdown: Record<string, number> = {};
    for (const expense of expenses) {
      const key = groupBy === 'category' ? expense.category :
                  groupBy === 'paymentMethod' ? expense.paymentMethod :
                  expense.expenseDate.toISOString().split('T')[0];
      if (!breakdown[key]) {
        breakdown[key] = 0;
      }
      breakdown[key] += Number(expense.amountSYP || 0);
    }

    return {
      totalAmountSYP,
      totalAmountUSD,
      breakdown
    };
  }
}

export default new ExpenseManagementService();
