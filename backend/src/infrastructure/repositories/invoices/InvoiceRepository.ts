import { IInvoiceRepository } from '../../../application/invoices/interfaces/IInvoiceRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';
import { QueueService } from '../../../queues/queue.service';
import { JobTypes } from '../../../queues/queue.config';

export class InvoiceRepository implements IInvoiceRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          items: true,
          customer: true,
          booking: true,
          payments: true,
        },
      });
      return invoice;
    } catch (error) {
      throw new DatabaseError('Failed to find invoice by id', error);
    }
  }

  async findByBookingId(bookingId: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const invoice = await prisma.invoice.findFirst({
        where: { bookingId },
        include: {
          items: true,
          customer: true,
          payments: true,
        },
      });
      return invoice;
    } catch (error) {
      throw new DatabaseError('Failed to find invoice by booking', error);
    }
  }

  async save(invoice: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      
      // Use transaction for invoice creation with journal entries and stock movements
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.invoice.create({
          data: {
            id: invoice.id,
            tenantId: invoice.tenantId,
            customerId: invoice.customerId,
            bookingId: invoice.bookingId,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            subtotalSYP: invoice.subtotalSYP,
            subtotalUSD: invoice.subtotalUSD,
            taxSYP: invoice.taxSYP,
            taxUSD: invoice.taxUSD,
            discountSYP: invoice.discountSYP,
            discountUSD: invoice.discountUSD,
            totalSYP: invoice.totalSYP,
            totalUSD: invoice.totalUSD,
            status: invoice.status,
            notes: invoice.notes,
          },
        });

        // Create invoice items if provided
        if (invoice.items && Array.isArray(invoice.items)) {
          for (const item of invoice.items) {
            await tx.invoiceItem.create({
              data: {
                id: item.id || crypto.randomUUID(),
                invoiceId: created.id,
                partId: item.partId,
                description: item.description,
                quantity: item.quantity,
                priceSYP: item.priceSYP,
                priceUSD: item.priceUSD,
                totalSYP: item.totalSYP,
                totalUSD: item.totalUSD,
              },
            });

            // Create stock movement for parts
            if (item.partId) {
              await tx.inventoryTransaction.create({
                data: {
                  id: crypto.randomUUID(),
                  tenantId: invoice.tenantId,
                  partId: item.partId,
                  type: 'CONSUMPTION',
                  quantity: item.quantity,
                  costSYP: item.priceSYP,
                  costUSD: item.priceUSD,
                  reference: `INV-${created.invoiceNumber}`,
                  notes: `Invoice item: ${item.description}`,
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
        }

        // Create journal entry if provided
        if (invoice.journalEntry) {
          await tx.journalEntry.create({
            data: {
              id: invoice.journalEntry.id,
              tenantId: invoice.tenantId,
              entryDate: invoice.invoiceDate,
              reference: `INV-${created.invoiceNumber}`,
              description: `Invoice ${created.invoiceNumber}`,
              status: 'POSTED',
              sourceType: 'INVOICE',
              sourceId: created.id,
            },
          });

          // Create journal lines
          if (invoice.journalEntry.lines && Array.isArray(invoice.journalEntry.lines)) {
            for (const line of invoice.journalEntry.lines) {
              await tx.journalLine.create({
                data: {
                  id: crypto.randomUUID(),
                  entryId: invoice.journalEntry.id,
                  accountId: line.accountId,
                  accountName: line.accountName,
                  debitSYP: line.debitSYP || 0,
                  debitUSD: line.debitUSD || 0,
                  creditSYP: line.creditSYP || 0,
                  creditUSD: line.creditUSD || 0,
                  description: line.description,
                  sourceType: 'INVOICE',
                  sourceId: created.id,
                },
              });
            }
          }
        }

        return created;
      });

      // Add accounting job for journal entry processing
      await QueueService.addAccountingJob(JobTypes.PROCESS_JOURNAL_ENTRY, {
        entryId: invoice.journalEntry?.id,
        tenantId: invoice.tenantId,
        invoiceId: result.id,
      });

      // Add PDF job for invoice PDF generation
      await QueueService.addPdfJob(JobTypes.GENERATE_INVOICE_PDF, {
        invoiceId: result.id,
        tenantId: invoice.tenantId,
      });

      return result;
    } catch (error) {
      throw new DatabaseError('Failed to save invoice', error);
    }
  }

  async update(invoice: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotalSYP: invoice.subtotalSYP,
          subtotalUSD: invoice.subtotalUSD,
          taxSYP: invoice.taxSYP,
          taxUSD: invoice.taxUSD,
          discountSYP: invoice.discountSYP,
          discountUSD: invoice.discountUSD,
          totalSYP: invoice.totalSYP,
          totalUSD: invoice.totalUSD,
          paidSYP: invoice.paidSYP,
          paidUSD: invoice.paidUSD,
          status: invoice.status,
          notes: invoice.notes,
        },
      });
      return updated;
    } catch (error) {
      throw new DatabaseError('Failed to update invoice', error);
    }
  }

  async list(tenantId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const invoices = await prisma.invoice.findMany({
        where: { tenantId },
        include: {
          items: true,
          customer: true,
          booking: true,
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
      });
      return invoices;
    } catch (error) {
      throw new DatabaseError('Failed to list invoices', error);
    }
  }
}
