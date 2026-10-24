import { Request, Response } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import prisma from '../../config/database';
import { ExpenseManagementService } from './expense-management.service';
import { createJournalEntry, getAccountIdByRole } from '../accounting/automatic-journal-entries';
import { DEFAULT_ACCOUNT_CODES } from '../accounting/chart-of-accounts.defaults';
import settingsService from '../../services/settings.service';
import { AuthRequest } from '../../shared/middlewares/auth';
import { isValidQuantity } from '../../utils/quantity';
import { Logger } from '../../infrastructure/logging/logger';

// Expense categories → chart-of-accounts code. Supports Arabic and English keys.
// Category 'EQUIPMENT' is an asset purchase, not an operating expense.
const EXPENSE_CATEGORY_ACCOUNTS: Record<string, keyof typeof DEFAULT_ACCOUNT_CODES> = {
  'UTILITIES': 'UTILITIES_EXPENSE',
  'Utilities': 'UTILITIES_EXPENSE',
  'كهرباء وماء': 'UTILITIES_EXPENSE',
  'INTERNET': 'UTILITIES_EXPENSE',
  'إنترنت واتصالات': 'UTILITIES_EXPENSE',
  'RENT': 'RENT_EXPENSE',
  'Rent': 'RENT_EXPENSE',
  'إيجار': 'RENT_EXPENSE',
  'SALARIES': 'PAYROLL_EXPENSE',
  'Salaries': 'PAYROLL_EXPENSE',
  'رواتب': 'PAYROLL_EXPENSE',
  'SUPPLIES': 'ADMIN_EXPENSES',
  'Supplies': 'ADMIN_EXPENSES',
  'مستلزمات': 'ADMIN_EXPENSES',
  'BUFFET': 'ADMIN_EXPENSES',
  'بوفيه': 'ADMIN_EXPENSES',
  'MAINTENANCE': 'MAINTENANCE_EXPENSE',
  'Maintenance': 'MAINTENANCE_EXPENSE',
  'صيانة': 'MAINTENANCE_EXPENSE',
  'EQUIPMENT': 'FIXED_ASSET',
  'معدات': 'FIXED_ASSET',
  'MARKETING': 'ADMIN_EXPENSES',
  'Marketing': 'ADMIN_EXPENSES',
  'تسويق': 'ADMIN_EXPENSES',
  'TRANSPORTATION': 'ADMIN_EXPENSES',
  'Transportation': 'ADMIN_EXPENSES',
  'نقل ووقود': 'ADMIN_EXPENSES',
  'JOB_PURCHASE': 'COST_OF_GOODS_SOLD',
  'مشتريات مهمة': 'COST_OF_GOODS_SOLD',
  'OTHER': 'ADMIN_EXPENSES',
  'أخرى': 'ADMIN_EXPENSES',
};

export class ExpensesController {
  private service = new ExpenseManagementService();

  async uploadExpenseAttachment(req: AuthRequest, res: Response) {
    try {
      const { dataUrl, fileName } = req.body || {};
      if (typeof dataUrl !== 'string' || typeof fileName !== 'string') {
        res.status(400).json({ success: false, message: 'Choose an invoice image or PDF' });
        return;
      }
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
      if (!match || match[2].length > 9_800_000) {
        res.status(400).json({ success: false, message: 'Attachment must be an image or PDF under 7 MB' });
        return;
      }
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length === 0 || buffer.length > 7 * 1024 * 1024) {
        res.status(400).json({ success: false, message: 'Attachment must be under 7 MB' });
        return;
      }
      const validSignature =
        (mimeType === 'application/pdf' && buffer.subarray(0, 4).toString() === '%PDF') ||
        (mimeType === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
        (mimeType === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
        (mimeType === 'image/webp' && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP');
      if (!validSignature) {
        res.status(400).json({ success: false, message: 'Attachment file type could not be verified' });
        return;
      }

      const extension = mimeType === 'application/pdf' ? '.pdf'
        : mimeType === 'image/png' ? '.png'
          : mimeType === 'image/webp' ? '.webp' : '.jpg';
      const filePath = path.join(process.cwd(), 'uploads', 'expense-receipts');
      await mkdir(filePath, { recursive: true });
      const safeFileName = `${randomUUID()}${extension}`;
      await writeFile(path.join(filePath, safeFileName), buffer, { flag: 'wx' });
      res.status(201).json({
        success: true,
        data: {
          url: `/uploads/expense-receipts/${safeFileName}`,
          originalName: path.basename(fileName).slice(0, 180),
        },
      });
    } catch (error: any) {
      Logger.error('Upload expense attachment error', error);
      res.status(500).json({ success: false, message: 'Failed to save invoice attachment' });
    }
  }

  async createExpense(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const {
        category,
        description,
        amountSYP,
        amountUSD,
        expenseDate,
        dueDate: requestedDueDate,
        paymentMethod,
        reference,
        notes,
        bookingId: requestedBookingId,
        bookingServiceId,
        serviceId: requestedServiceId,
        costCenterId,
        supplierId,
        quantity: requestedQuantity,
        attachmentUrl,
        isRecurring,
        recurringFrequency,
      } = req.body;
      if (!category || !description || !expenseDate || !paymentMethod) {
        res.status(400).json({ error: 'category, description, expenseDate and paymentMethod are required' });
        return;
      }
      if (!['CASH', 'BANK', 'PAYABLE', 'كاش'].includes(paymentMethod)) {
        res.status(400).json({ error: 'Choose cash, bank, or supplier payable as the payment method' });
        return;
      }
      let bookingId = requestedBookingId as string | undefined;
      let serviceId = requestedServiceId as string | undefined;
      const quantity = requestedQuantity == null ? undefined : Number(requestedQuantity);
      if (category === 'JOB_PURCHASE') {
        if (!bookingId) {
          res.status(400).json({ error: 'Direct job purchases must be linked to a work order' });
          return;
        }
        if (quantity == null || !isValidQuantity(quantity)) {
          res.status(400).json({ error: 'Enter a positive purchase quantity using at most three decimal places' });
          return;
        }
        if (typeof attachmentUrl !== 'string' || !/^\/uploads\/expense-receipts\/[a-f0-9-]+\.(jpg|png|webp|pdf)$/i.test(attachmentUrl)) {
          res.status(400).json({ error: 'Attach the supplier invoice image or PDF to a direct job purchase' });
          return;
        }
      }
      if (paymentMethod === 'PAYABLE' && !supplierId) {
        res.status(400).json({ error: 'Choose a supplier for purchases left payable' });
        return;
      }
      const dueDate = requestedDueDate ? new Date(requestedDueDate) : undefined;
      if (requestedDueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
        res.status(400).json({ error: 'Invalid supplier due date' });
        return;
      }
      if (paymentMethod === 'PAYABLE' && !dueDate) {
        res.status(400).json({ error: 'Enter the agreed supplier payment due date' });
        return;
      }
      if (supplierId) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: supplierId, tenantId, isActive: true, deletedAt: null },
          select: { id: true },
        });
        if (!supplier) {
          res.status(400).json({ error: 'Supplier not found or inactive' });
          return;
        }
      }
      if (bookingId) {
        const booking = await prisma.booking.findFirst({ where: { id: bookingId, tenantId, deletedAt: null }, select: { id: true } });
        if (!booking) {
          res.status(400).json({ error: 'Booking not found' });
          return;
        }
      }
      if (category === 'JOB_PURCHASE' && bookingId) {
        const workOrder = await prisma.workOrder.findFirst({
          where: { tenantId, bookingId },
          select: { status: true },
        });
        if (!workOrder) {
          res.status(400).json({ error: 'Work order not found for this booking' });
          return;
        }
        if (workOrder.status === 'COMPLETED' || workOrder.status === 'CANCELLED') {
          res.status(400).json({ error: 'Direct purchases cannot be added to a closed work order' });
          return;
        }
      }
      if (bookingServiceId) {
        const bookingService = await prisma.bookingService.findFirst({
          where: {
            id: bookingServiceId,
            ...(bookingId ? { bookingId } : {}),
            booking: { tenantId, deletedAt: null },
            deletedAt: null,
          },
          select: { id: true, bookingId: true, serviceId: true },
        });
        if (!bookingService) {
          res.status(400).json({ error: 'Service line was not found on that work order' });
          return;
        }
        if (serviceId && serviceId !== bookingService.serviceId) {
          res.status(400).json({ error: 'Selected service does not match the work-order service line' });
          return;
        }
        bookingId = bookingService.bookingId;
        serviceId = bookingService.serviceId;
      } else if (serviceId) {
        const service = await prisma.service.findFirst({
          where: { id: serviceId, tenantId, deletedAt: null },
          select: { id: true },
        });
        if (!service) {
          res.status(400).json({ error: 'Service not found' });
          return;
        }
      }
      if (costCenterId) {
        const costCenter = await prisma.costCenter.findFirst({
          where: { id: costCenterId, tenantId, isActive: true },
          select: { id: true },
        });
        if (!costCenter) {
          res.status(400).json({ error: 'Cost center not found or inactive' });
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

      const accountRole = EXPENSE_CATEGORY_ACCOUNTS[category] || 'ADMIN_EXPENSES';
      const isCash = paymentMethod === 'CASH' || paymentMethod === 'كاش';
      const isPayable = paymentMethod === 'PAYABLE';
      const userId = req.user!.id;
      const originalCurrency = usd > 0 && syp <= 0 ? 'USD' : 'SYP';
      const originalAmount = originalCurrency === 'USD' ? usd : syp;

      // Expense + journal entry in ONE transaction — either both post or neither does.
      const expense = await prisma.$transaction(async (tx) => {
        let effectiveCostCenterId = costCenterId as string | undefined;
        let configuredCostAccountId: string | null = null;
        if (category === 'JOB_PURCHASE' && serviceId) {
          const service = await tx.service.findFirst({
            where: { id: serviceId, tenantId, deletedAt: null },
            select: {
              costAccountId: true,
              category: { select: { costAccountId: true, costCenterId: true } },
            },
          });
          configuredCostAccountId = service?.costAccountId || service?.category?.costAccountId || null;
          effectiveCostCenterId ||= service?.category?.costCenterId || undefined;
        }
        if (effectiveCostCenterId) {
          const center = await tx.costCenter.findFirst({
            where: { id: effectiveCostCenterId, tenantId, isActive: true },
            select: { id: true },
          });
          if (!center) throw new Error('Cost center is not active in this tenant');
        }
        const created = await this.service.createExpense(
          tenantId, category, description, finalSYP, finalUSD, new Date(expenseDate), dueDate,
          paymentMethod, reference, notes, isRecurring, recurringFrequency, bookingId,
          bookingServiceId, serviceId, effectiveCostCenterId, supplierId,
          quantity, quantity ? Math.round((finalSYP / quantity) * 100) / 100 : undefined,
          quantity ? Math.round((finalUSD / quantity) * 100) / 100 : undefined,
          attachmentUrl, originalAmount, originalCurrency, exchangeRate, tx
        );

        let debitAccountId: string | null = null;
        if (configuredCostAccountId) {
            const account = await tx.account.findFirst({
              where: {
                id: configuredCostAccountId,
                tenantId,
                isActive: true,
                deletedAt: null,
                accountType: 'COGS',
              },
              select: { id: true, children: { select: { id: true } } },
            });
            if (!account || account.children.length > 0) {
              throw new Error('The service cost account is not configured as an active posting account');
            }
            debitAccountId = account.id;
        }
        debitAccountId ||= await getAccountIdByRole(tenantId, accountRole, tx);
        const creditAccountId = await getAccountIdByRole(
          tenantId,
          isPayable ? 'ACCOUNTS_PAYABLE' : isCash ? 'CASH' : 'BANK',
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
              bookingId: created.bookingId || null,
              serviceId: created.serviceId || null,
              bookingServiceId: created.bookingServiceId || null,
              costCenterId: created.costCenterId || null,
            },
            {
              accountId: creditAccountId,
              debitSYP: 0,
              debitUSD: 0,
              creditSYP: finalSYP,
              creditUSD: finalUSD,
              description: isPayable ? `Payable to supplier ${supplierId}` : `Payment via ${isCash ? 'CASH' : 'BANK'}`,
              bookingId: created.bookingId || null,
              serviceId: created.serviceId || null,
              bookingServiceId: created.bookingServiceId || null,
              costCenterId: created.costCenterId || null,
              supplierId: isPayable ? created.supplierId || null : null,
              dueDate: isPayable ? created.dueDate || null : null,
            },
          ],
          tx,
          exchangeRate
        );
        if (isPayable && created.supplierId) {
          await tx.supplier.update({
            where: { id: created.supplierId },
            data: { balance: { increment: finalSYP } },
          });
        }

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
