import { IPaymentRepository } from '../../../application/accounting/interfaces/IPaymentRepository';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseError } from '../../errors/database-error';
import { QueueService } from '../../../queues/queue.service';
import { JobTypes } from '../../../queues/queue.config';

export class PaymentRepository implements IPaymentRepository {
  async findById(id: string): Promise<any | null> {
    try {
      const prisma = PrismaService.getInstance();
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
        },
      });
      return payment;
    } catch (error) {
      throw new DatabaseError('Failed to find payment by id', error);
    }
  }

  async save(payment: any): Promise<any> {
    try {
      const prisma = PrismaService.getInstance();
      
      // Use transaction for payment with journal entry
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.payment.create({
          data: {
            id: payment.id,
            tenantId: payment.tenantId,
            invoiceId: payment.invoiceId,
            amountSYP: payment.amountSYP,
            amountUSD: payment.amountUSD,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            reference: payment.reference,
            notes: payment.notes,
            cashRegisterSessionId: payment.cashRegisterSessionId,
          },
        });

        // Update invoice paid amount
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidSYP: {
              increment: payment.amountSYP,
            },
            paidUSD: {
              increment: payment.amountUSD || 0,
            },
          },
        });

        // Create journal entry if provided
        if (payment.journalEntry) {
          await tx.journalEntry.create({
            data: {
              id: payment.journalEntry.id,
              tenantId: payment.tenantId,
              entryDate: payment.paymentDate,
              reference: `PAY-${created.id}`,
              description: `Payment ${payment.reference || created.id}`,
              status: 'POSTED',
              sourceType: 'PAYMENT',
              sourceId: created.id,
            },
          });

          // Create journal lines
          if (payment.journalEntry.lines && Array.isArray(payment.journalEntry.lines)) {
            for (const line of payment.journalEntry.lines) {
              await tx.journalLine.create({
                data: {
                  id: crypto.randomUUID(),
                  entryId: payment.journalEntry.id,
                  accountId: line.accountId,
                  accountName: line.accountName,
                  debitSYP: line.debitSYP || 0,
                  debitUSD: line.debitUSD || 0,
                  creditSYP: line.creditSYP || 0,
                  creditUSD: line.creditUSD || 0,
                  description: line.description,
                  sourceType: 'PAYMENT',
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
        entryId: payment.journalEntry?.id,
        tenantId: payment.tenantId,
        paymentId: result.id,
      });

      // Add PDF job for receipt PDF generation
      await QueueService.addPdfJob(JobTypes.GENERATE_RECEIPT_PDF, {
        paymentId: result.id,
        tenantId: payment.tenantId,
      });

      return result;
    } catch (error) {
      throw new DatabaseError('Failed to save payment', error);
    }
  }

  async listByCustomer(customerId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const payments = await prisma.payment.findMany({
        where: {
          invoice: {
            customerId,
          },
        },
        include: {
          invoice: true,
        },
        orderBy: { paymentDate: 'desc' },
      });
      return payments;
    } catch (error) {
      throw new DatabaseError('Failed to list payments by customer', error);
    }
  }

  async listBySupplier(supplierId: string): Promise<any[]> {
    try {
      const prisma = PrismaService.getInstance();
      const payments = await prisma.payment.findMany({
        where: {
          invoice: {
            customerId: supplierId,
          },
        },
        include: {
          invoice: true,
        },
        orderBy: { paymentDate: 'desc' },
      });
      return payments;
    } catch (error) {
      throw new DatabaseError('Failed to list payments by supplier', error);
    }
  }
}
