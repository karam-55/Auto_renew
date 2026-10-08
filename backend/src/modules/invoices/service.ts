import prisma from '../../config/database';
import {
  Invoice,
  InvoiceItem,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceFilters,
  InvoiceSummary,
  CreateInvoiceItemDto,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { LoyaltyService } from '../loyalty/service';
import settingsService from '../../services/settings.service';
import { WhatsAppService } from '../whatsapp/service';
import { TelegramAdminNotificationService } from '../notifications/telegram-admin-notification.service';
import { PaymentService } from '../payments/service';
import { createInvoiceJournalEntry, createStockConsumptionJournalEntry, ensureDefaultAccounts, reverseJournalEntry } from '../accounting/automatic-journal-entries';

export class InvoiceService {
  private loyaltyService: LoyaltyService;
  private whatsappService: WhatsAppService;
  private telegramAdminNotificationService: TelegramAdminNotificationService;
  private io: any;

  constructor() {
    this.loyaltyService = new LoyaltyService();
    this.whatsappService = new WhatsAppService();
    this.telegramAdminNotificationService = new TelegramAdminNotificationService();
  }

  setIo(io: any) {
    this.io = io;
    this.loyaltyService.setIo(io);
    this.whatsappService.setIo(io);
  }
  /**
   * Create a new invoice
   */
  async createInvoice(tenantId: string, userId: string, data: CreateInvoiceDto): Promise<Invoice> {
    // Validate and convert dates
    let invoiceDate: Date;
    let dueDate: Date | null = null;

    if (typeof data.invoiceDate === 'string') {
      invoiceDate = new Date(data.invoiceDate);
    } else if (data.invoiceDate instanceof Date) {
      invoiceDate = data.invoiceDate;
    } else {
      invoiceDate = new Date();
    }

    // Validate invoice date
    if (isNaN(invoiceDate.getTime())) {
      throw new Error('Invalid invoice date');
    }

    if (data.dueDate) {
      if (typeof data.dueDate === 'string') {
        dueDate = new Date(data.dueDate);
      } else if (data.dueDate instanceof Date) {
        dueDate = data.dueDate;
      }

      if (dueDate && isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date');
      }
    }

    // Validate customer exists if provided
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId },
      });
      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // Validate booking exists if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: data.bookingId, tenantId },
      });
      if (!booking) {
        throw new Error('Booking not found');
      }
    }

    // Validate vehicle exists if provided
    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, tenantId },
      });
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
    }

    // Validate items exist
    if (!data.items || data.items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }

    // Validate item quantities and prices — USD is the base currency;
    // accept either USD or SYP and auto-fill the missing side from the exchange rate
    const settings = await settingsService.getSettings(tenantId);
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const defaultTaxRate = Number(settings.taxRate || 0) / 100;
    for (const item of data.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Item quantity must be a positive whole number');
      }
      if (item.priceUSD != null && item.priceUSD > 0) {
        item.priceSYP = Math.round(item.priceUSD * exchangeRate);
      } else if (item.priceSYP != null && item.priceSYP > 0) {
        item.priceUSD = Math.round((item.priceSYP / exchangeRate) * 100) / 100;
      } else {
        throw new Error('Item price is required (USD or SYP)');
      }
    }

    // Calculate totals
    let subtotalSYP = 0;
    let subtotalUSD = 0;

    const calculatedItems = data.items.map((item) => {
      const itemTotalSYP = item.quantity * item.priceSYP;
      const itemTotalUSD = item.priceUSD ? item.quantity * item.priceUSD : null;

      subtotalSYP += itemTotalSYP;
      if (itemTotalUSD) {
        subtotalUSD += itemTotalUSD;
      }

      return {
        ...item,
        totalSYP: itemTotalSYP,
        totalUSD: itemTotalUSD,
      };
    });

    // Calculate tax if taxRateId is provided
    let taxRate = defaultTaxRate;
    if (data.taxRateId) {
      const configuredTaxRate = await prisma.taxRate.findFirst({
        where: { id: data.taxRateId, tenantId },
      });
      if (!configuredTaxRate) throw new Error('Tax rate not found');
      taxRate = Number(configuredTaxRate.rate);
    }
    const taxSYP = Math.round(subtotalSYP * taxRate * 100) / 100;
    const taxUSD = subtotalUSD > 0
      ? Math.round(subtotalUSD * taxRate * 100) / 100
      : null;

    // Apply discount (percentage or fixed)
    const discountType = data.discountType || 'FIXED';
    let discountSYP = data.discountSYP ?? 0;
    let discountUSD = data.discountUSD ?? null;

    if (discountType === 'PERCENTAGE') {
      const percent = data.discountPercent ?? 0;
      if (percent < 0 || percent > 100) throw new Error('Discount percentage must be between 0 and 100');
      discountSYP = Math.round(subtotalSYP * (percent / 100));
      discountUSD = Math.round(subtotalUSD * (percent / 100) * 100) / 100;
    } else if (discountUSD != null && discountUSD > 0) {
      discountSYP = Math.round(discountUSD * exchangeRate);
    } else if (discountSYP > 0) {
      discountUSD = Math.round((discountSYP / exchangeRate) * 100) / 100;
    }
    if (discountSYP < 0 || discountUSD != null && discountUSD < 0 || discountSYP > subtotalSYP || discountUSD != null && discountUSD > subtotalUSD) {
      throw new Error('Discount cannot be negative or exceed the invoice subtotal');
    }

    const totalSYP = subtotalSYP + taxSYP - discountSYP;
    const totalUSD = subtotalUSD > 0 ? subtotalUSD + (taxUSD || 0) - (discountUSD || 0) : null;

    // Generate invoice number (format: INV-YYYY-XXXXX)
    const year = invoiceDate.getFullYear();
    const invoicePrefix = settings.invoicePrefix?.trim() || 'INV';

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoiceNumberSequence.upsert({
        where: { tenantId_year: { tenantId, year } },
        create: { tenantId, year, lastValue: 1 },
        update: { lastValue: { increment: 1 } },
      });
      const invoiceNumber = `${invoicePrefix}-${year}-${String(sequence.lastValue).padStart(5, '0')}`;

      // Create invoice
      const createdInvoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          bookingId: data.bookingId,
          taxRateId: data.taxRateId,
          discountType,
          discountPercent: data.discountPercent || null,
          subtotalSYP,
          subtotalUSD,
          taxSYP,
          taxUSD,
          discountSYP,
          discountUSD,
          totalSYP,
          totalUSD,
          paidSYP: 0,
          paidUSD: 0,
          status: InvoiceStatus.DRAFT,
          notes: data.notes,
          installmentPlanId: data.installmentPlanId,
        },
      });

      // Create invoice items; stock is consumed only when the invoice is finalized.
      const items = await Promise.all(
        calculatedItems.map((item) => tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            partId: item.partId,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            priceSYP: item.priceSYP,
            priceUSD: item.priceUSD,
            totalSYP: item.totalSYP,
            totalUSD: item.totalUSD,
          },
        }))
      );

      return { invoice: createdInvoice, items };
    });

    return this.mapToInvoiceResponse(invoice.invoice, invoice.items);
  }

  /**
   * Get all invoices with optional filters
   */
  async getInvoices(tenantId: string, filters: InvoiceFilters = {}): Promise<Invoice[]> {
    const where: any = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.bookingId) {
      where.bookingId = filters.bookingId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.invoiceDate = {};
      if (filters.dateFrom) {
        where.invoiceDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.invoiceDate.lte = filters.dateTo;
      }
    }
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    // limit === 0 means "all rows" (lookup mode). Default to 50 for list views.
    const limit = filters.limit ?? 50;
    const isLookupAll = limit === 0;
    const skip = isLookupAll ? 0 : (page - 1) * limit;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
          },
        },
        customer: true,
        booking: true,
        taxRate: true,
        installmentPlan: true,
      },
      orderBy: [{ invoiceDate: 'desc' }, { invoiceNumber: 'desc' }],
      skip,
      // limit === 0 → "all rows": omit take so Prisma returns everything.
      take: isLookupAll ? undefined : limit,
    });

    return invoices.map((invoice) => this.mapToInvoiceResponse(invoice, invoice.items));
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(tenantId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                duration: true,
                basePrice: true,
              },
            },
          },
        },
        customer: true,
        vehicle: true,
        booking: {
          include: {
            vehicle: true,
          },
        },
        taxRate: true,
        installmentPlan: true,
      },
    });

    if (!invoice) {
      throw new Error('NOT_FOUND');
    }

    return this.mapToInvoiceResponse(invoice, invoice.items);
  }

  /**
   * Update invoice
   * Only allowed if status is DRAFT
   */
  async updateInvoice(tenantId: string, invoiceId: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { items: true },
    });

    if (!existingInvoice) {
      throw new Error('Invoice not found');
    }

    // Financial changes are restricted to DRAFT invoices.
    const hasItemChanges = data.items && data.items.length > 0;
    const hasFinancialChanges = hasItemChanges || data.discountType !== undefined ||
      data.discountPercent !== undefined || data.discountSYP !== undefined ||
      data.discountUSD !== undefined || data.taxRateId !== undefined;
    if (existingInvoice.status !== InvoiceStatus.DRAFT && hasFinancialChanges) {
      throw new Error('Only draft invoices can be changed financially');
    }
    if (existingInvoice.status === InvoiceStatus.PAID || existingInvoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('CANNOT_MODIFY_PAID_OR_CANCELLED_INVOICE');
    }

    // If updating items, recalculate totals
    if (data.items && data.items.length > 0) {
      // Rebuild draft invoice items atomically after recalculating totals.
      // USD is the base currency — auto-fill the missing side from the exchange rate
      const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
      for (const item of data.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error('Item quantity must be a positive whole number');
        if (item.priceUSD != null && item.priceUSD > 0) {
          item.priceSYP = Math.round(item.priceUSD * exchangeRate);
        } else if (item.priceSYP != null && item.priceSYP > 0) {
          item.priceUSD = Math.round((item.priceSYP / exchangeRate) * 100) / 100;
        } else {
          throw new Error('Item price is required (USD or SYP)');
        }
      }

      // Calculate new totals
      let subtotalSYP = 0;
      let subtotalUSD = 0;

      const calculatedItems = data.items.map((item) => {
        const itemTotalSYP = item.quantity * item.priceSYP;
        const itemTotalUSD = item.priceUSD ? item.quantity * item.priceUSD : null;

        subtotalSYP += itemTotalSYP;
        if (itemTotalUSD) {
          subtotalUSD += itemTotalUSD;
        }

        return {
          ...item,
          totalSYP: itemTotalSYP,
          totalUSD: itemTotalUSD,
        };
      });

      // Recalculate tax if taxRateId exists on existing invoice or in update data
      let taxSYP = 0;
      let taxUSD: number | null = null;
      const effectiveTaxRateId = data.taxRateId || existingInvoice.taxRateId;
      const settings = await settingsService.getSettings(tenantId);
      let taxRate = Number(settings.taxRate || 0) / 100;
      if (effectiveTaxRateId) {
        const configuredTaxRate = await prisma.taxRate.findFirst({ where: { id: effectiveTaxRateId, tenantId } });
        if (!configuredTaxRate) throw new Error('Tax rate not found');
        taxRate = Number(configuredTaxRate.rate);
      }
      taxSYP = Math.round(subtotalSYP * taxRate * 100) / 100;
      taxUSD = subtotalUSD > 0 ? Math.round(subtotalUSD * taxRate * 100) / 100 : null;

      const discountType = data.discountType || existingInvoice.discountType || 'FIXED';
      let discountSYP = Number(data.discountSYP ?? existingInvoice.discountSYP ?? 0);
      let discountUSD = data.discountUSD != null
        ? Number(data.discountUSD)
        : existingInvoice.discountUSD != null ? Number(existingInvoice.discountUSD) : null;

      if (discountType === 'PERCENTAGE') {
        const percent = data.discountPercent ?? Number(existingInvoice.discountPercent || 0);
        if (percent < 0 || percent > 100) throw new Error('Discount percentage must be between 0 and 100');
        discountSYP = Math.round(subtotalSYP * (percent / 100));
        discountUSD = Math.round(subtotalUSD * (percent / 100) * 100) / 100;
      } else if (data.discountUSD !== undefined && data.discountUSD !== null) {
        discountUSD = Number(data.discountUSD);
        discountSYP = Math.round(discountUSD * exchangeRate);
      } else if (data.discountSYP !== undefined && data.discountSYP !== null) {
        discountSYP = Number(data.discountSYP);
        discountUSD = Math.round((discountSYP / exchangeRate) * 100) / 100;
      } else if (data.discountType !== undefined && discountUSD != null && discountUSD > 0) {
        discountSYP = Math.round(discountUSD * exchangeRate);
      }
      if (discountSYP < 0 || discountUSD != null && discountUSD < 0 || discountSYP > subtotalSYP || discountUSD != null && discountUSD > subtotalUSD) {
        throw new Error('Discount cannot be negative or exceed the invoice subtotal');
      }

      const totalSYP = subtotalSYP + taxSYP - discountSYP;
      const totalUSD = subtotalUSD > 0 ? subtotalUSD + (taxUSD || 0) - Number(discountUSD || 0) : null;

      // Update invoice with new totals
      const { updatedInvoice, items } = await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            invoiceDate: data.invoiceDate,
            dueDate: data.dueDate,
            notes: data.notes,
            taxRateId: effectiveTaxRateId,
            discountType,
            discountPercent: data.discountPercent ?? existingInvoice.discountPercent,
            subtotalSYP,
            subtotalUSD,
            taxSYP,
            taxUSD,
            discountSYP,
            discountUSD,
            totalSYP,
            totalUSD,
          },
        });

        // Create new items
        const items = await Promise.all(
          calculatedItems.map((item) => tx.invoiceItem.create({
            data: {
              invoiceId,
              partId: item.partId,
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              priceSYP: item.priceSYP,
              priceUSD: item.priceUSD,
              totalSYP: item.totalSYP,
              totalUSD: item.totalUSD,
            },
          }))
        );
        return { updatedInvoice, items };
      });

      return this.mapToInvoiceResponse(updatedInvoice, items);
    } else {
      // Update basic fields + recalculate totals if discount changed
      let taxSYP = Number(existingInvoice.taxSYP);
      let taxUSD = Number(existingInvoice.taxUSD || 0);
      const effectiveTaxRateId = data.taxRateId || existingInvoice.taxRateId;
      if (data.taxRateId !== undefined) {
        const taxRate = effectiveTaxRateId
          ? await prisma.taxRate.findFirst({ where: { id: effectiveTaxRateId, tenantId } })
          : null;
        if (effectiveTaxRateId && !taxRate) throw new Error('Tax rate not found');
        const rate = Number(taxRate?.rate || 0);
        taxSYP = Number(existingInvoice.subtotalSYP) * rate;
        taxUSD = Number(existingInvoice.subtotalUSD || 0) * rate;
      }

      const discountType = data.discountType ?? existingInvoice.discountType;
      let discountSYP = Number(data.discountSYP ?? existingInvoice.discountSYP ?? 0);
      let discountUSD = Number(data.discountUSD ?? existingInvoice.discountUSD ?? 0);
      const discountWasChanged = data.discountType !== undefined || data.discountPercent !== undefined ||
        data.discountSYP !== undefined || data.discountUSD !== undefined;

      if (discountType === 'PERCENTAGE' && discountWasChanged) {
        const percent = Number(data.discountPercent ?? existingInvoice.discountPercent ?? 0);
        if (percent < 0 || percent > 100) throw new Error('Discount percentage must be between 0 and 100');
        discountSYP = Math.round(Number(existingInvoice.subtotalSYP) * (percent / 100));
        discountUSD = Math.round(Number(existingInvoice.subtotalUSD || 0) * (percent / 100) * 100) / 100;
      } else if (discountType === 'FIXED' && discountWasChanged) {
        const rate = await settingsService.getRequiredExchangeRate(tenantId);
        if (data.discountUSD != null) {
          discountUSD = Number(data.discountUSD);
          discountSYP = Math.round(discountUSD * rate);
        } else if (data.discountSYP != null) {
          discountSYP = Number(data.discountSYP);
          discountUSD = Math.round((discountSYP / rate) * 100) / 100;
        } else if (discountUSD > 0) {
          discountSYP = Math.round(discountUSD * rate);
        } else if (discountSYP > 0) {
          discountUSD = Math.round((discountSYP / rate) * 100) / 100;
        }
      }

      if (discountSYP < 0 || discountUSD < 0 || discountSYP > Number(existingInvoice.subtotalSYP) || discountUSD > Number(existingInvoice.subtotalUSD || 0)) {
        throw new Error('Discount cannot be negative or exceed the invoice subtotal');
      }

      const totalSYP = Number(existingInvoice.subtotalSYP) + taxSYP - discountSYP;
      const totalUSD = Number(existingInvoice.subtotalUSD || 0) > 0
        ? Number(existingInvoice.subtotalUSD) + taxUSD - discountUSD
        : null;

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          notes: data.notes,
          ...(data.taxRateId !== undefined ? { taxRateId: effectiveTaxRateId } : {}),
          discountType,
          discountPercent: data.discountPercent ?? existingInvoice.discountPercent,
          taxSYP,
          taxUSD,
          discountSYP,
          discountUSD,
          totalSYP,
          totalUSD,
        },
      });

      return this.mapToInvoiceResponse(updatedInvoice, existingInvoice.items);
    }
  }

  /**
   * Delete invoice
   * Only allowed if status is DRAFT
   */
  async deleteInvoice(tenantId: string, invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Only allow deletion of draft invoices; issued invoices must be cancelled with reversals.
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be deleted');
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }

  /**
   * Cancel invoice (change status from PENDING/ISSUED to CANCELLED)
   */
  async cancelInvoice(tenantId: string, invoiceId: string, userId?: string): Promise<Invoice> {
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, tenantId } });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.ISSUED) {
        throw new Error('CANNOT_CANCEL_INVOICE');
      }
      const paymentTotals = await tx.payment.aggregate({
        where: { tenantId, invoiceId, deletedAt: null },
        _sum: { amountSYP: true, amountUSD: true },
      });
      const paidSYP = Number(paymentTotals._sum.amountSYP || 0);
      const paidUSD = Number(paymentTotals._sum.amountUSD || 0);
      if (paidSYP > 0 || paidUSD > 0) {
        throw new Error('Cannot cancel an invoice with payments; reverse/refund its payments first');
      }

      const claim = await tx.invoice.updateMany({
        where: { id: invoiceId, tenantId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.ISSUED] } },
        data: { status: InvoiceStatus.CANCELLED },
      });
      if (claim.count !== 1) throw new Error('Invoice status changed; reload and retry');

      const invoiceJournal = await tx.journalEntry.findFirst({
        where: { tenantId, sourceType: 'INVOICE', sourceId: invoiceId, isReversed: false },
      });
      if (invoiceJournal) {
        await reverseJournalEntry(invoiceJournal.id, `Invoice ${invoice.invoiceNumber} cancelled`, tenantId, userId || null, tx);
      }

      const transactions = await tx.inventoryTransaction.findMany({
        where: { tenantId, invoiceId, type: 'CONSUMPTION' },
      });
      for (const transaction of transactions) {
        const reversalExists = await tx.inventoryTransaction.findFirst({
          where: { tenantId, invoiceId, type: 'RETURN', reference: `CANCEL:${transaction.id}` },
          select: { id: true },
        });
        if (reversalExists) continue;

        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            partId: transaction.partId,
            type: 'RETURN',
            quantity: transaction.quantity,
            costSYP: transaction.costSYP,
            costUSD: transaction.costUSD,
            reference: `CANCEL:${transaction.id}`,
            notes: `Restored from cancelled invoice ${invoice.invoiceNumber}`,
            invoiceId,
            createdBy: userId,
          },
        });
        await tx.part.update({
          where: { id: transaction.partId },
          data: { quantity: { increment: transaction.quantity } },
        });

        const inventoryJournal = await tx.journalEntry.findFirst({
          where: { tenantId, sourceType: 'INVENTORY_TRANSACTION', sourceId: transaction.id, isReversed: false },
        });
        if (inventoryJournal) {
          await reverseJournalEntry(inventoryJournal.id, `Invoice ${invoice.invoiceNumber} cancelled`, tenantId, userId || null, tx);
        }
      }

      return tx.invoice.findUnique({ where: { id: invoiceId } });
    });

    return this.mapToInvoiceResponse(updatedInvoice, []);
  }

  /**
   * Pay invoice (change status from SENT/ISSUED to PAID)
   */
  async payInvoice(tenantId: string, invoiceId: string, userId?: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === InvoiceStatus.DRAFT) throw new Error('CANNOT_PAY_DRAFT');
    if (invoice.status === InvoiceStatus.CANCELLED) throw new Error('CANNOT_PAY_CANCELLED');
    if (invoice.status === InvoiceStatus.PAID) throw new Error('ALREADY_PAID');

    const paymentService = new PaymentService();
    if (invoice.totalUSD != null && Number(invoice.totalUSD) > 0) {
      await paymentService.createPayment(tenantId, userId || 'system', {
        invoiceId,
        amountUSD: Math.max(0, Number(invoice.totalUSD) - Number(invoice.paidUSD || 0)),
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.CASH,
        notes: 'Auto payment from payInvoice',
      });
    } else {
      await paymentService.createPayment(tenantId, userId || 'system', {
        invoiceId,
        amountSYP: Math.max(0, Number(invoice.totalSYP) - Number(invoice.paidSYP || 0)),
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.CASH,
        notes: 'Auto payment from payInvoice',
      });
    }

    const updatedInvoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!updatedInvoice) throw new Error('Invoice not found after payment');
    return this.mapToInvoiceResponse(updatedInvoice, []);
  }

  /**
   * Finalize invoice (change status from DRAFT to ISSUED)
   */
  async finalizeInvoice(tenantId: string, invoiceId: string, userId?: string): Promise<Invoice> {
    const exchangeRate = await settingsService.getRequiredExchangeRate(tenantId);
    const { invoice, updatedInvoice } = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          items: {
            include: {
              service: {
                include: { serviceParts: { include: { part: true } } },
              },
            },
          },
          customer: true,
        },
      });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status !== InvoiceStatus.DRAFT) throw new Error('Can only finalize invoices in DRAFT status');

      const claim = await tx.invoice.updateMany({
        where: { id: invoiceId, tenantId, status: InvoiceStatus.DRAFT },
        data: { status: InvoiceStatus.ISSUED },
      });
      if (claim.count !== 1) throw new Error('Invoice status changed; reload and retry');

      await ensureDefaultAccounts(tenantId, tx);

      const partsToConsume = new Map<string, { quantity: number; part: any }>();
      const addPart = (part: any, quantity: number) => {
        if (!part || part.tenantId !== tenantId) throw new Error('Invoice contains a missing or invalid part');
        const existing = partsToConsume.get(part.id);
        if (existing) existing.quantity += quantity;
        else partsToConsume.set(part.id, { quantity, part });
      };

      for (const item of invoice.items) {
        if (item.partId) {
          const part = await tx.part.findFirst({ where: { id: item.partId, tenantId } });
          addPart(part, item.quantity);
        }
        if (item.serviceId && item.service?.serviceParts) {
          for (const servicePart of item.service.serviceParts) {
            addPart(servicePart.part, servicePart.quantity * item.quantity);
          }
        }
      }

      for (const [partId, data] of partsToConsume) {
        const deduction = await tx.part.updateMany({
          where: { id: partId, tenantId, quantity: { gte: data.quantity } },
          data: { quantity: { decrement: data.quantity } },
        });
        if (deduction.count !== 1) throw new Error(`Insufficient stock for part ${data.part.name}`);
        const costUSD = data.part.costUSD != null
          ? Number(data.part.costUSD)
          : Math.round((Number(data.part.costSYP) / exchangeRate) * 100) / 100;
        const costSYP = data.part.costUSD != null
          ? Math.round(costUSD * exchangeRate)
          : Number(data.part.costSYP);

        const transaction = await tx.inventoryTransaction.create({
          data: {
            tenantId,
            partId,
            type: 'CONSUMPTION',
            quantity: data.quantity,
            costSYP,
            costUSD,
            reference: invoice.invoiceNumber,
            notes: `Part used in invoice ${invoice.invoiceNumber}`,
            invoiceId,
            createdBy: userId,
          },
          include: { part: { select: { name: true } } },
        });
        await createStockConsumptionJournalEntry(transaction, tenantId, userId || null, tx);
      }

      const updatedInvoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!updatedInvoice) throw new Error('Invoice not found after finalization');
      await createInvoiceJournalEntry({ ...updatedInvoice, items: invoice.items, customer: invoice.customer }, tenantId, userId || null, tx);
      return { invoice, updatedInvoice };
    }, { isolationLevel: 'Serializable' });

    // Add loyalty points if customer exists
    if (invoice.customerId && invoice.customer) {
      try {
        const points = await this.loyaltyService.calculatePointsFromInvoice(
          Number(invoice.totalSYP)
        );

        if (points > 0) {
          await this.loyaltyService.addPoints(tenantId, {
            customerId: invoice.customerId,
            points: points,
            reason: `Invoice ${invoice.invoiceNumber} completed`,
            invoiceId: invoiceId,
          });

          // Update invoice with points earned
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              loyaltyPointsEarned: points,
            },
          });

          // Send WhatsApp notification for loyalty points
          try {
            await this.whatsappService.sendLoyaltyPointsEarned(
              invoice.customer.fullName,
              invoice.customer.phone,
              points,
              'Garage Go'
            );
          } catch (error) {
            Logger.error('Error sending WhatsApp loyalty notification:', error);
            // Don't fail the invoice finalization if WhatsApp fails
          }
        }
      } catch (error) {
        Logger.error('Error adding loyalty points:', error);
        // Don't fail the invoice finalization if loyalty points fail
      }

      // Send WhatsApp notification for invoice
      try {
        await this.whatsappService.sendInvoiceNotification({
          customerName: invoice.customer.fullName,
          customerPhone: invoice.customer.phone,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: Number(invoice.totalSYP),
          dueDate: invoice.dueDate ? invoice.dueDate.toString() : '',
          garageName: 'Garage Go',
        });
      } catch (error) {
        Logger.error('Error sending WhatsApp invoice notification:', error);
        // Don't fail the invoice finalization if WhatsApp fails
      }
    }

    // Send Telegram notification to owners/managers
    setImmediate(async () => {
      try {
        await this.telegramAdminNotificationService.notifyInvoiceCreated(
          tenantId,
          updatedInvoice,
          invoice.customer?.fullName
        );
      } catch (telegramError) {
        Logger.error('Error sending Telegram admin notification for invoice:', telegramError);
      }
    });

    return this.mapToInvoiceResponse(updatedInvoice, invoice.items);
  }

  /**
   * Get invoice summaries (lightweight version for lists)
   */
  async getInvoiceSummaries(tenantId: string, filters: InvoiceFilters = {}): Promise<InvoiceSummary[]> {
    const where: any = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.invoiceDate = {};
      if (filters.dateFrom) {
        where.invoiceDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.invoiceDate.lte = filters.dateTo;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: [{ invoiceDate: 'desc' }, { invoiceNumber: 'desc' }],
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      customerName: invoice.customer?.fullName || undefined,
      subtotalSYP: Number(invoice.subtotalSYP),
      totalSYP: Number(invoice.totalSYP),
      paidSYP: Number(invoice.paidSYP),
      status: invoice.status,
    }));
  }

  /**
   * Map Prisma invoice to response format
   */
  private mapToInvoiceResponse(invoice: any, items: any[]): Invoice {
    let subtotalSYP = Number(invoice.subtotalSYP);
    let subtotalUSD = invoice.subtotalUSD ? Number(invoice.subtotalUSD) : null;
    let totalSYP = Number(invoice.totalSYP);
    let totalUSD = invoice.totalUSD ? Number(invoice.totalUSD) : null;

    // Recalculate from items when stored subtotal is zero but items exist (old invoices with missing service prices)
    if (items.length > 0 && subtotalSYP === 0) {
      const itemSubtotalSYP = items.reduce((sum: number, item: any) => sum + (Number(item.priceSYP) * Number(item.quantity)), 0);
      const itemSubtotalUSD = items.reduce((sum: number, item: any) => sum + (Number(item.priceUSD || 0) * Number(item.quantity)), 0);
      if (itemSubtotalSYP > 0) {
        subtotalSYP = itemSubtotalSYP;
        if (itemSubtotalUSD > 0) subtotalUSD = itemSubtotalUSD;

        const taxSYP = Number(invoice.taxSYP);
        const taxUSD = invoice.taxUSD ? Number(invoice.taxUSD) : 0;
        const discountSYP = Number(invoice.discountSYP);
        const discountUSD = invoice.discountUSD ? Number(invoice.discountUSD) : 0;

        totalSYP = subtotalSYP + taxSYP - discountSYP;
        if (subtotalUSD !== null || itemSubtotalUSD > 0) {
          totalUSD = (subtotalUSD || itemSubtotalUSD) + taxUSD - discountUSD;
        }
      }
    }

    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      bookingId: invoice.bookingId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotalSYP,
      subtotalUSD,
      taxSYP: Number(invoice.taxSYP),
      taxUSD: invoice.taxUSD ? Number(invoice.taxUSD) : null,
      taxRateId: invoice.taxRateId,
      discountType: invoice.discountType,
      discountPercent: invoice.discountPercent ? Number(invoice.discountPercent) : null,
      discountSYP: Number(invoice.discountSYP),
      discountUSD: invoice.discountUSD ? Number(invoice.discountUSD) : null,
      loyaltyPointsEarned: invoice.loyaltyPointsEarned,
      loyaltyPointsRedeemed: invoice.loyaltyPointsRedeemed,
      totalSYP,
      totalUSD: totalUSD || null,
      paidSYP: Number(invoice.paidSYP),
      paidUSD: invoice.paidUSD ? Number(invoice.paidUSD) : null,
      status: invoice.status,
      notes: invoice.notes,
      installmentPlanId: invoice.installmentPlanId,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      items: items.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoiceId,
        partId: item.partId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        priceSYP: Number(item.priceSYP),
        priceUSD: item.priceUSD ? Number(item.priceUSD) : null,
        totalSYP: Number(item.totalSYP),
        totalUSD: item.totalUSD ? Number(item.totalUSD) : null,
      })),
      customer: invoice.customer,
      booking: invoice.booking,
      vehicle: invoice.vehicle || invoice.booking?.vehicle,
      taxRate: invoice.taxRate,
      installmentPlan: invoice.installmentPlan,
    };
  }
}
