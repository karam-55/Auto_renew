import prisma from '../../config/database';
import {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentFilters,
  PaymentSummary,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { createPaymentReceivedJournalEntry, ensureDefaultAccounts, reverseJournalEntry } from '../accounting/automatic-journal-entries';
import { WhatsAppService } from '../whatsapp/service';
import { TelegramAdminNotificationService } from '../notifications/telegram-admin-notification.service';
import { PdfWorker } from '../../workers/pdf.worker';
import settingsService from '../../services/settings.service';
import { randomUUID } from 'crypto';
import fs from 'fs';

async function normalizePaymentAmounts(
  tenantId: string,
  amountSYP?: number | null,
  amountUSD?: number | null,
  fallback?: { amountSYP: number; amountUSD: number | null }
): Promise<{ amountSYP: number; amountUSD: number }> {
  let syp = amountSYP == null ? undefined : Number(amountSYP);
  let usd = amountUSD == null ? undefined : Number(amountUSD);
  if (syp == null && usd == null && fallback) {
    syp = fallback.amountSYP;
    usd = fallback.amountUSD == null ? undefined : Number(fallback.amountUSD);
  }
  if ((syp == null || syp <= 0) && (usd == null || usd <= 0)) {
    throw new Error('Payment amount is required (USD or SYP)');
  }

  const rate = await settingsService.getRequiredExchangeRate(tenantId);
  if (usd != null && usd > 0) syp = Math.round(usd * rate);
  else if (syp != null && syp > 0) usd = Math.round((syp / rate) * 100) / 100;
  if (!Number.isFinite(syp) || !Number.isFinite(usd) || (syp as number) <= 0 || (usd as number) <= 0) {
    throw new Error('Payment amount must be greater than zero in both currencies');
  }
  return { amountSYP: syp as number, amountUSD: usd as number };
}

function getInvoicePaymentStatus(invoice: any, paidSYP: number, paidUSD: number): InvoiceStatus {
  if (invoice.totalUSD != null && Number(invoice.totalUSD) > 0) {
    return paidUSD >= Number(invoice.totalUSD) - 0.005
      ? InvoiceStatus.PAID
      : paidUSD > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.ISSUED;
  }
  return paidSYP >= Number(invoice.totalSYP) - 0.01
    ? InvoiceStatus.PAID
    : paidSYP > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.ISSUED;
}

export class PaymentService {
  private telegramAdminNotificationService = new TelegramAdminNotificationService();
  /**
   * Create a new payment
   * Updates invoice paid amount
   */
  async createPayment(tenantId: string, userId: string, data: CreatePaymentDto): Promise<Payment> {
    const amounts = await normalizePaymentAmounts(tenantId, data.amountSYP, data.amountUSD);
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) throw new Error('Invalid payment date');

    // Create payment + journal entry in one transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Validate invoice exists and belongs to tenant
      const invoice = await tx.invoice.findFirst({ where: { id: data.invoiceId, tenantId } });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === InvoiceStatus.DRAFT) throw new Error('Cannot make payment for a draft invoice');
      if (invoice.status === InvoiceStatus.CANCELLED) throw new Error('Cannot pay a cancelled invoice');

      const paidBefore = await tx.payment.aggregate({
        where: { tenantId, invoiceId: data.invoiceId, deletedAt: null },
        _sum: { amountSYP: true, amountUSD: true },
      });
      const paidBeforeSYP = Number(paidBefore._sum.amountSYP || 0);
      const paidBeforeUSD = Number(paidBefore._sum.amountUSD || 0);
      if (invoice.totalUSD != null && Number(invoice.totalUSD) > 0) {
        if (paidBeforeUSD + amounts.amountUSD > Number(invoice.totalUSD) + 0.005) throw new Error('Payment exceeds the remaining invoice balance');
      } else if (paidBeforeSYP + amounts.amountSYP > Number(invoice.totalSYP) + 0.01) {
        throw new Error('Payment exceeds the remaining invoice balance');
      }

      // Ensure default accounts exist for journal entries
      await ensureDefaultAccounts(tenantId, tx);
      // Create payment
      const createdPayment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: data.invoiceId,
          amountSYP: amounts.amountSYP,
          amountUSD: amounts.amountUSD,
          paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          cashRegisterSessionId: data.cashRegisterSessionId,
        },
      });
      const paidAfter = await tx.payment.aggregate({
        where: { tenantId, invoiceId: data.invoiceId, deletedAt: null },
        _sum: { amountSYP: true, amountUSD: true },
      });
      const paidSYP = Number(paidAfter._sum.amountSYP || 0);
      const paidUSD = Number(paidAfter._sum.amountUSD || 0);
      const status = getInvoicePaymentStatus(invoice, paidSYP, paidUSD);
      // Update invoice paid amount and status
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: { paidSYP, paidUSD, status },
      });

      const paymentWithInvoice = await tx.payment.findUnique({
        where: { id: createdPayment.id },
        include: { invoice: true },
      });
      if (!paymentWithInvoice) throw new Error('Created payment could not be reloaded');
      await createPaymentReceivedJournalEntry(paymentWithInvoice, tenantId, userId, tx);
      return createdPayment;
    }, { isolationLevel: 'Serializable' });

    // Send WhatsApp payment confirmation
    setImmediate(async () => {
      try {
        const paymentWithDetails = await prisma.payment.findUnique({
          where: { id: payment.id },
          include: {
            invoice: {
              include: {
                items: true,
                customer: { select: { fullName: true, phone: true } },
                booking: { select: { publicToken: true } },
              },
            },
          },
        });

        if (!paymentWithDetails?.invoice?.customer?.phone) return;

        const invoice = paymentWithDetails.invoice;
        const customer = invoice.customer;
        if (!customer) return;
        const customerPhone = customer.phone;
        const customerName = customer.fullName;
        const invoiceId = invoice.id;
        const invoiceNumber = invoice.invoiceNumber || invoiceId.substring(0, 8).toUpperCase();
        const totalPaid = Number(invoice.paidSYP);

        // Generate invoice PDF if not exists
        const pdfPath = `uploads/pdfs/invoices/${invoiceId}.pdf`;
        let pdfUrl = `/uploads/pdfs/invoices/${invoiceId}.pdf`;
        const baseUrl = process.env.BASE_URL || process.env.SERVER_URL || '';
        const fullPdfUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${pdfUrl}` : pdfUrl;

        if (!fs.existsSync(pdfPath)) {
          try {
            const pdfResult = await PdfWorker.generateInvoicePdf({
              invoiceId,
              invoiceNumber,
              customerName,
              date: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: invoice.status,
              items: invoice.items?.map((item: any) => ({
                name: item.description || 'خدمة',
                quantity: item.quantity || 1,
                price: Number(item.priceSYP || 0),
                total: Number(item.totalSYP || item.priceSYP || 0),
              })),
              subtotal: Number(invoice.subtotalSYP || 0),
              tax: Number(invoice.taxSYP || 0),
              discount: Number(invoice.discountSYP || 0),
              total: Number(invoice.totalSYP || 0),
            });
            pdfUrl = pdfResult.pdfUrl;
          } catch (pdfError) {
            Logger.error('Failed to generate invoice PDF for WhatsApp:', pdfError);
          }
        }

        // Recompute full PDF URL in case pdfUrl changed after generation
        const finalFullPdfUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${pdfUrl}` : pdfUrl;

        // Send WhatsApp payment confirmation with PDF
        const whatsappService = new WhatsAppService();
        await whatsappService.sendPaymentConfirmation({
          customerName,
          customerPhone,
          invoiceNumber,
          totalAmount: totalPaid,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SY') : new Date().toLocaleDateString('ar-SY'),
          garageName: 'Garage Go',
          pdfUrl: finalFullPdfUrl,
        });
      } catch (whatsappError) {
        Logger.error('Error sending WhatsApp payment confirmation:', whatsappError);
      }
    });

    // Send Telegram notification to owners/managers about payment received
    setImmediate(async () => {
      try {
        const paymentWithDetails = await prisma.payment.findUnique({
          where: { id: payment.id },
          include: {
            invoice: {
              include: {
                customer: { select: { fullName: true } },
              },
            },
          },
        });

        if (paymentWithDetails?.invoice) {
          await this.telegramAdminNotificationService.notifyPaymentReceived(
            tenantId,
            paymentWithDetails.invoice,
            Number(paymentWithDetails.amountSYP),
            paymentWithDetails.invoice.customer?.fullName
          );
        }
      } catch (telegramError) {
        Logger.error('Error sending Telegram admin notification for payment:', telegramError);
      }
    });

    return this.mapToPaymentResponse(payment);
  }

  /**
   * Get all payments with optional filters
   */
  async getPayments(tenantId: string, filters: PaymentFilters = {}): Promise<Payment[]> {
    const where: any = { tenantId };

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) {
        where.paymentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.paymentDate.lte = filters.dateTo;
      }
    }
    if (filters.search) {
      where.OR = [
        { reference: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: true,
        CashRegisterSession: true,
      },
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
    });

    return payments.map((payment) => this.mapToPaymentResponse(payment));
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(tenantId: string, paymentId: string): Promise<Payment | null> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: true,
        CashRegisterSession: true,
      },
    });

    if (!payment) {
      return null;
    }

    return this.mapToPaymentResponse(payment);
  }

  /**
   * Update payment
   * Only allowed if invoice is not fully paid
   */
  async updatePayment(tenantId: string, paymentId: string, data: UpdatePaymentDto, userId?: string): Promise<Payment> {
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: { invoice: true },
      });
      if (!existing) throw new Error('Payment not found');
      if (!existing.invoice) throw new Error('Payment invoice not found');

      const amountChanged = data.amountSYP !== undefined || data.amountUSD !== undefined;
      const amounts = amountChanged
        ? await normalizePaymentAmounts(tenantId, data.amountSYP, data.amountUSD)
        : { amountSYP: Number(existing.amountSYP), amountUSD: Number(existing.amountUSD || 0) };
      const paymentDate = data.paymentDate ? new Date(data.paymentDate) : existing.paymentDate;
      if (Number.isNaN(paymentDate.getTime())) throw new Error('Invalid payment date');

      const journalChanged = amountChanged || data.paymentMethod !== undefined || data.paymentDate !== undefined || data.reference !== undefined;
      if (journalChanged) {
        const journalEntries = await tx.journalEntry.findMany({
          where: {
            tenantId,
            isReversed: false,
            OR: [
              { sourceType: 'PAYMENT', sourceId: paymentId },
              { sourceType: 'PAYMENT_UPDATE', sourceId: { startsWith: `${paymentId}:` } },
            ],
          },
        });
        for (const entry of journalEntries) {
          await reverseJournalEntry(entry.id, 'Payment corrected', tenantId, userId || null, tx);
        }
        await ensureDefaultAccounts(tenantId, tx);
      }

      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          paymentDate,
          amountSYP: amounts.amountSYP,
          amountUSD: amounts.amountUSD,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
        },
      });
      const paidAfter = await tx.payment.aggregate({
        where: { tenantId, invoiceId: existing.invoiceId, deletedAt: null },
        _sum: { amountSYP: true, amountUSD: true },
      });
      const paidSYP = Number(paidAfter._sum.amountSYP || 0);
      const paidUSD = Number(paidAfter._sum.amountUSD || 0);
      if (existing.invoice.totalUSD != null && Number(existing.invoice.totalUSD) > 0) {
        if (paidUSD > Number(existing.invoice.totalUSD) + 0.005) throw new Error('Payment exceeds the remaining invoice balance');
      } else if (paidSYP > Number(existing.invoice.totalSYP) + 0.01) {
        throw new Error('Payment exceeds the remaining invoice balance');
      }
      const status = getInvoicePaymentStatus(existing.invoice, paidSYP, paidUSD);
      await tx.invoice.update({
        where: { id: existing.invoiceId },
        data: { paidSYP, paidUSD, status },
      });

      if (journalChanged) {
        const paymentWithInvoice = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { invoice: true },
        });
        if (!paymentWithInvoice) throw new Error('Updated payment could not be reloaded');
        await createPaymentReceivedJournalEntry(
          paymentWithInvoice,
          tenantId,
          userId || null,
          tx,
          'PAYMENT_UPDATE',
          `${paymentId}:${randomUUID()}`
        );
      }

      return tx.payment.findUnique({
        where: { id: updatedPayment.id },
        include: { invoice: true, CashRegisterSession: true },
      });
    }, { isolationLevel: 'Serializable' });

    if (!payment) throw new Error('Updated payment could not be reloaded');
    return this.mapToPaymentResponse(payment);
  }

  /**
   * Delete payment
   * Reverses the payment amount from invoice
   */
  async deletePayment(tenantId: string, paymentId: string, userId?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId },
        include: { invoice: true },
      });
      if (!payment) throw new Error('Payment not found');
      if (!payment.invoice) throw new Error('Payment invoice not found');

      const journalEntries = await tx.journalEntry.findMany({
        where: {
          tenantId,
          isReversed: false,
          OR: [
            { sourceType: 'PAYMENT', sourceId: paymentId },
            { sourceType: 'PAYMENT_UPDATE', sourceId: { startsWith: `${paymentId}:` } },
          ],
        },
      });
      for (const entry of journalEntries) {
        await reverseJournalEntry(entry.id, 'Payment deleted', tenantId, userId || null, tx);
      }

      await tx.payment.update({ where: { id: paymentId }, data: { deletedAt: new Date() } });
      const paidAfter = await tx.payment.aggregate({
        where: { tenantId, invoiceId: payment.invoiceId, deletedAt: null },
        _sum: { amountSYP: true, amountUSD: true },
      });
      const paidSYP = Number(paidAfter._sum.amountSYP || 0);
      const paidUSD = Number(paidAfter._sum.amountUSD || 0);
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidSYP,
          paidUSD,
          status: getInvoicePaymentStatus(payment.invoice, paidSYP, paidUSD),
        },
      });
    }, { isolationLevel: 'Serializable' });
  }

  /**
   * Get payment summaries (lightweight version for lists)
   */
  async getPaymentSummaries(tenantId: string, filters: PaymentFilters = {}): Promise<PaymentSummary[]> {
    const where: any = { tenantId };

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) {
        where.paymentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.paymentDate.lte = filters.dateTo;
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      paymentDate: payment.paymentDate,
      amountSYP: Number(payment.amountSYP),
      amountUSD: payment.amountUSD ? Number(payment.amountUSD) : null,
      paymentMethod: payment.paymentMethod,
      invoiceNumber: payment.invoice?.invoiceNumber,
    }));
  }

  /**
   * Map Prisma payment to response format
   */
  private mapToPaymentResponse(payment: any): Payment {
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      invoiceId: payment.invoiceId,
      amountSYP: Number(payment.amountSYP),
      amountUSD: payment.amountUSD ? Number(payment.amountUSD) : null,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference,
      notes: payment.notes,
      cashRegisterSessionId: payment.cashRegisterSessionId,
      createdAt: payment.createdAt,
      invoice: payment.invoice,
      cashRegisterSession: payment.CashRegisterSession,
    };
  }
}
