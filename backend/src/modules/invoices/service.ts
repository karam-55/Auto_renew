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
import { WhatsAppService } from '../whatsapp/service';
import { createInvoiceJournalEntry, createStockConsumptionJournalEntry, createPaymentReceivedJournalEntry, ensureDefaultAccounts } from '../accounting/automatic-journal-entries';

export class InvoiceService {
  private loyaltyService: LoyaltyService;
  private whatsappService: WhatsAppService;
  private io: any;

  constructor() {
    this.loyaltyService = new LoyaltyService();
    this.whatsappService = new WhatsAppService();
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

    // Validate item quantities and prices
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than 0');
      }
      if (item.priceSYP <= 0) {
        throw new Error('Item price in SYP must be greater than 0');
      }
      if (item.priceUSD !== undefined && item.priceUSD <= 0) {
        throw new Error('Item price in USD must be greater than 0');
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
    let taxSYP = 0;
    let taxUSD: number | null = null;
    if (data.taxRateId) {
      const taxRate = await prisma.taxRate.findFirst({
        where: { id: data.taxRateId, tenantId },
      });
      if (taxRate) {
        taxSYP = subtotalSYP * Number(taxRate.rate);
        if (subtotalUSD > 0) {
          taxUSD = subtotalUSD * Number(taxRate.rate);
        }
      }
    }

    // Apply discount (percentage or fixed)
    const discountType = data.discountType || 'FIXED';
    let discountSYP = data.discountSYP || 0;
    let discountUSD = data.discountUSD || null;

    if (discountType === 'PERCENTAGE' && data.discountPercent && data.discountPercent > 0) {
      discountSYP = Math.round(subtotalSYP * (data.discountPercent / 100));
      if (subtotalUSD > 0) {
        discountUSD = Math.round(subtotalUSD * (data.discountPercent / 100));
      }
    }

    const totalSYP = subtotalSYP + taxSYP - discountSYP;
    const totalUSD = subtotalUSD > 0 ? subtotalUSD + (taxUSD || 0) - (discountUSD || 0) : null;

    // Generate invoice number (format: INV-YYYY-XXXXX)
    const year = invoiceDate.getFullYear();
    const count = await prisma.invoice.count({
      where: {
        tenantId,
        invoiceNumber: { startsWith: `INV-${year}` },
      },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
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

      // Create invoice items and create inventory transactions for parts
      const items = await Promise.all(
        calculatedItems.map(async (item) => {
          const invoiceItem = await tx.invoiceItem.create({
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
          });

          // If this is a part item, create inventory transaction (CONSUMPTION)
          if (item.partId) {
            const part = await tx.part.findUnique({
              where: { id: item.partId },
            });

            if (part) {
              await tx.inventoryTransaction.create({
                data: {
                  tenantId,
                  partId: item.partId,
                  type: 'CONSUMPTION',
                  quantity: item.quantity,
                  costSYP: part.costSYP,
                  reference: `INV-${createdInvoice.invoiceNumber}`,
                  notes: `Part consumed for invoice ${createdInvoice.invoiceNumber}`,
                },
              });

              // Update part quantity
              await tx.part.update({
                where: { id: item.partId },
                data: {
                  quantity: {
                    decrement: item.quantity,
                  },
                },
              });
            }
          }

          return invoiceItem;
        })
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
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

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
      take: limit,
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

    // Allow discount updates on ISSUED invoices, but block item changes on non-DRAFT
    const isDiscountOnlyUpdate = data.discountType !== undefined || data.discountPercent !== undefined || data.discountSYP !== undefined || data.discountUSD !== undefined;
    const hasItemChanges = data.items && data.items.length > 0;
    if (existingInvoice.status !== InvoiceStatus.DRAFT && hasItemChanges) {
      throw new Error('CANNOT_MODIFY_ISSUED_INVOICE');
    }
    if (existingInvoice.status === InvoiceStatus.PAID || existingInvoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('CANNOT_MODIFY_PAID_OR_CANCELLED_INVOICE');
    }

    // If updating items, recalculate totals
    if (data.items && data.items.length > 0) {
      // Delete old items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId },
      });

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
      if (effectiveTaxRateId) {
        const taxRate = await prisma.taxRate.findFirst({
          where: { id: effectiveTaxRateId, tenantId },
        });
        if (taxRate) {
          taxSYP = subtotalSYP * Number(taxRate.rate);
          if (subtotalUSD > 0) {
            taxUSD = subtotalUSD * Number(taxRate.rate);
          }
        }
      }

      const discountType = data.discountType || existingInvoice.discountType || 'FIXED';
      let discountSYP = Number(data.discountSYP ?? existingInvoice.discountSYP ?? 0);
      let discountUSD = data.discountUSD ?? existingInvoice.discountUSD ?? null;

      if (discountType === 'PERCENTAGE' && data.discountPercent && data.discountPercent > 0) {
        discountSYP = Math.round(subtotalSYP * (data.discountPercent / 100));
        if (subtotalUSD > 0) {
          discountUSD = Math.round(subtotalUSD * (data.discountPercent / 100));
        }
      }

      const totalSYP = subtotalSYP + taxSYP - discountSYP;
      const totalUSD = subtotalUSD > 0 ? subtotalUSD + (taxUSD || 0) - Number(discountUSD || 0) : null;

      // Update invoice with new totals
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          notes: data.notes,
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
        },
      });

      // Create new items
      const items = await Promise.all(
        calculatedItems.map((item) =>
          prisma.invoiceItem.create({
            data: {
              invoiceId,
              partId: item.partId,
              description: item.description,
              quantity: item.quantity,
              priceSYP: item.priceSYP,
              priceUSD: item.priceUSD,
              totalSYP: item.totalSYP,
              totalUSD: item.totalUSD,
            },
          })
        )
      );

      return this.mapToInvoiceResponse(updatedInvoice, items);
    } else {
      // Update basic fields + recalculate totals if discount changed
      let discountSYP = Number(existingInvoice.discountSYP);
      let discountUSD = existingInvoice.discountUSD ? Number(existingInvoice.discountUSD) : 0;
      let totalSYP = Number(existingInvoice.totalSYP);
      let totalUSD = existingInvoice.totalUSD ? Number(existingInvoice.totalUSD) : 0;

      if (data.discountType !== undefined || data.discountPercent !== undefined || data.discountSYP !== undefined) {
        const discountType = data.discountType || existingInvoice.discountType || 'FIXED';
        if (discountType === 'PERCENTAGE' && (data.discountPercent !== undefined || existingInvoice.discountPercent)) {
          const pct = data.discountPercent ?? existingInvoice.discountPercent ?? 0;
          discountSYP = Math.round(Number(existingInvoice.subtotalSYP) * (Number(pct) / 100));
          if (existingInvoice.subtotalUSD && Number(existingInvoice.subtotalUSD) > 0) {
            discountUSD = Math.round(Number(existingInvoice.subtotalUSD) * (Number(pct) / 100));
          }
        } else if (data.discountSYP !== undefined) {
          discountSYP = Number(data.discountSYP);
        }
        totalSYP = Number(existingInvoice.subtotalSYP) + Number(existingInvoice.taxSYP) - discountSYP;
        if (existingInvoice.subtotalUSD && Number(existingInvoice.subtotalUSD) > 0) {
          totalUSD = Number(existingInvoice.subtotalUSD) + Number(existingInvoice.taxUSD || 0) - discountUSD;
        }
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          notes: data.notes,
          discountType: data.discountType,
          discountPercent: data.discountPercent ?? null,
          discountSYP: discountSYP as any,
          discountUSD: discountUSD as any,
          totalSYP: totalSYP as any,
          totalUSD: totalUSD as any,
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

    // Only allow deletion of draft or issued invoices (issued allowed temporarily for cleanup)
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new Error('CANNOT_MODIFY_ISSUED_INVOICE');
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }

  /**
   * Cancel invoice (change status from PENDING/ISSUED to CANCELLED)
   */
  async cancelInvoice(tenantId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Only allow cancellation of SENT or ISSUED invoices
    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.ISSUED) {
      throw new Error('CANNOT_CANCEL_INVOICE');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });

    // Create RETURN transactions to restore inventory
    try {
      const existingTransactions = await prisma.inventoryTransaction.findMany({
        where: { invoiceId: invoiceId },
      });

      for (const transaction of existingTransactions) {
        // Create RETURN transaction
        await prisma.inventoryTransaction.create({
          data: {
            tenantId,
            partId: transaction.partId,
            type: 'RETURN',
            quantity: transaction.quantity,
            costSYP: transaction.costSYP,
            costUSD: transaction.costUSD,
            reference: transaction.reference,
            notes: `Restored from cancelled invoice ${invoice.invoiceNumber}`,
            invoiceId: invoiceId,
          },
        });

        // Add quantity back to part
        await prisma.part.update({
          where: { id: transaction.partId },
          data: {
            quantity: {
              increment: transaction.quantity,
            },
          },
        });
      }
    } catch (error) {
      Logger.error('Error creating RETURN inventory transactions:', error);
      // Don't fail the invoice cancellation if inventory transactions fail
    }

    return this.mapToInvoiceResponse(updatedInvoice, []);
  }

  /**
   * Pay invoice (change status from SENT/ISSUED to PAID)
   */
  async payInvoice(tenantId: string, invoiceId: string, userId?: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Only allow payment of SENT, ISSUED, or PARTIALLY_PAID invoices
    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new Error('CANNOT_PAY_DRAFT');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error('CANNOT_PAY_CANCELLED');
    }
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('ALREADY_PAID');
    }

    // Ensure default accounts exist for journal entries
    await ensureDefaultAccounts(tenantId);

    // Create payment record and update invoice in a transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Create payment record for full amount
      const remainingSYP = Number(invoice.totalSYP) - Number(invoice.paidSYP);
      const remainingUSD = (Number(invoice.totalUSD) || 0) - (Number(invoice.paidUSD) || 0);

      await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amountSYP: remainingSYP,
          amountUSD: remainingUSD > 0 ? remainingUSD : null,
          paymentDate: new Date(),
          paymentMethod: PaymentMethod.CASH,
          notes: 'Auto payment from payInvoice',
        },
      });

      // Update invoice to fully paid
      return await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidSYP: invoice.totalSYP,
          paidUSD: invoice.totalUSD || 0,
        },
      });
    });

    // Create auto-journal entry for payment received
    try {
      const paymentWithInvoice = await prisma.payment.findFirst({
        where: { invoiceId, tenantId },
        orderBy: { createdAt: 'desc' },
        include: { invoice: true },
      });

      if (paymentWithInvoice) {
        await createPaymentReceivedJournalEntry(paymentWithInvoice, tenantId, userId || 'system');
      }
    } catch (error) {
      Logger.error('Error creating journal entry for payInvoice:', error);
    }

    return this.mapToInvoiceResponse(updatedInvoice, []);
  }

  /**
   * Finalize invoice (change status from DRAFT to ISSUED)
   */
  async finalizeInvoice(tenantId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { 
        items: {
          include: {
            service: {
              include: {
                serviceParts: {
                  include: {
                    part: true,
                  },
                },
              },
            },
          },
        },
        customer: true 
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Can only finalize invoices in DRAFT status');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.ISSUED,
      },
    });

    // Create auto-journal entry for invoice
    try {
      await createInvoiceJournalEntry(updatedInvoice, tenantId);
    } catch (error) {
      Logger.error('Error creating journal entry for invoice:', error);
      throw new Error('Invoice finalized but journal entry creation failed. Please check the chart of accounts setup.');
    }

    // Create inventory transactions for parts
    try {
      // Collect all parts to consume (merge fixed service parts + dynamic invoice parts)
      const partsToConsume = new Map<string, { quantity: number; costSYP: number; costUSD: number | null }>();

      // Add dynamic parts from invoice items
      for (const item of invoice.items) {
        if (item.partId) {
          const existing = partsToConsume.get(item.partId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            partsToConsume.set(item.partId, {
              quantity: item.quantity,
              costSYP: Number(item.priceSYP),
              costUSD: item.priceUSD ? Number(item.priceUSD) : null,
            });
          }
        }

        // Add fixed service parts for services
        if (item.serviceId && item.service?.serviceParts) {
          for (const servicePart of item.service.serviceParts) {
            const existing = partsToConsume.get(servicePart.partId);
            if (existing) {
              existing.quantity += servicePart.quantity;
            } else {
              partsToConsume.set(servicePart.partId, {
                quantity: servicePart.quantity,
                costSYP: Number(servicePart.part.costSYP),
                costUSD: servicePart.part.costUSD ? Number(servicePart.part.costUSD) : null,
              });
            }
          }
        }
      }

      // Create CONSUMPTION transactions for all parts
      for (const [partId, data] of partsToConsume.entries()) {
        await prisma.inventoryTransaction.create({
          data: {
            tenantId,
            partId,
            type: 'CONSUMPTION',
            quantity: data.quantity,
            costSYP: data.costSYP,
            costUSD: data.costUSD,
            reference: invoice.invoiceNumber,
            notes: `Part used in invoice ${invoice.invoiceNumber}`,
            invoiceId: invoiceId,
          },
        });

        // Deduct quantity from part
        await prisma.part.update({
          where: { id: partId },
          data: {
            quantity: {
              decrement: data.quantity,
            },
          },
        });
      }
    } catch (error) {
      Logger.error('Error creating inventory transactions:', error);
      throw new Error('Invoice finalized but inventory transactions failed. Stock may not have been deducted properly.');
    }

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
