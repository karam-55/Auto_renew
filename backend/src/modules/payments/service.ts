import prisma from '../../config/database';
import {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentFilters,
  PaymentSummary,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { PaymentMethod } from '@prisma/client';
import { createPaymentReceivedJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';
import { WhatsAppService } from '../whatsapp/service';
import { TelegramAdminNotificationService } from '../notifications/telegram-admin-notification.service';
import { PdfWorker } from '../../workers/pdf.worker';
import fs from 'fs';

export class PaymentService {
  private telegramAdminNotificationService = new TelegramAdminNotificationService();
  /**
   * Create a new payment
   * Updates invoice paid amount
   */
  async createPayment(tenantId: string, userId: string, data: CreatePaymentDto): Promise<Payment> {
    // Validate amounts
    if (data.amountSYP <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
    if (data.amountUSD !== undefined && data.amountUSD <= 0) {
      throw new Error('Payment amount in USD must be greater than 0');
    }

    // Validate invoice exists and belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'DRAFT') {
      throw new Error('Cannot make payment for a draft invoice');
    }

    // Ensure default accounts exist for journal entries
    await ensureDefaultAccounts(tenantId);

    // Create payment + journal entry in one transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const createdPayment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: data.invoiceId,
          amountSYP: data.amountSYP,
          amountUSD: data.amountUSD,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          cashRegisterSessionId: data.cashRegisterSessionId,
        },
      });

      // Update invoice paid amount
      const currentPaidSYP = Number(invoice.paidSYP);
      const currentPaidUSD = Number(invoice.paidUSD);
      const newPaidSYP = currentPaidSYP + data.amountSYP;
      const newPaidUSD = data.amountUSD ? currentPaidUSD + data.amountUSD : currentPaidUSD;

      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidSYP: newPaidSYP,
          paidUSD: newPaidUSD,
        },
      });

      // Update invoice status if fully paid
      const totalSYP = Number(invoice.totalSYP);
      if (newPaidSYP >= totalSYP) {
        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: { status: 'PAID' as any },
        });
      } else {
        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: { status: 'PARTIALLY_PAID' as any },
        });
      }

      return createdPayment;
    });

    // Create auto-journal entry for payment (outside transaction since accounts already ensured)
    try {
      const paymentWithInvoice = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { invoice: true },
      });

      if (paymentWithInvoice) {
        await createPaymentReceivedJournalEntry(paymentWithInvoice, tenantId, userId);
      }
    } catch (error) {
      Logger.error('Error creating journal entry for payment:', error);
    }

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
  async updatePayment(tenantId: string, paymentId: string, data: UpdatePaymentDto): Promise<Payment> {
    const existingPayment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { invoice: true },
    });

    if (!existingPayment) {
      throw new Error('Payment not found');
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentDate: data.paymentDate,
        amountSYP: data.amountSYP,
        amountUSD: data.amountUSD,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        invoice: true,
        CashRegisterSession: true,
      },
    });

    return this.mapToPaymentResponse(payment);
  }

  /**
   * Delete payment
   * Reverses the payment amount from invoice
   */
  async deletePayment(tenantId: string, paymentId: string): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    await prisma.$transaction(async (tx) => {
      // Reverse invoice paid amount
      if (payment.invoice) {
        const currentPaidSYP = Number(payment.invoice.paidSYP);
        const currentPaidUSD = Number(payment.invoice.paidUSD);
        const newPaidSYP = currentPaidSYP - Number(payment.amountSYP);
        const newPaidUSD = payment.amountUSD ? currentPaidUSD - Number(payment.amountUSD) : currentPaidUSD;

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidSYP: Math.max(0, newPaidSYP),
            paidUSD: Math.max(0, newPaidUSD),
          },
        });

        // Update invoice status
        const totalSYP = Number(payment.invoice.totalSYP);
        if (newPaidSYP <= 0) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'ISSUED' as any },
          });
        } else if (newPaidSYP < totalSYP) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: 'PARTIALLY_PAID' as any },
          });
        }
      }

      // Delete payment
      await tx.payment.delete({
        where: { id: paymentId },
      });
    });
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
