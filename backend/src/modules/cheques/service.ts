import prisma from '../../config/database';
import {
  Cheque,
  CreateChequeDto,
  UpdateChequeDto,
  ChequeFilters,
  ChequeTransaction,
  CreateChequeTransactionDto,
  ChequeSummary,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { ChequeStatus, ChequeType } from '@prisma/client';
import { createChequeDepositJournalEntry, createChequeClearanceJournalEntry } from '../accounting/automatic-journal-entries';

export class ChequeService {
  private io: any;

  constructor(io?: any) {
    this.io = io;
  }

  setIo(io: any) {
    this.io = io;
  }

  /**
   * Create a new cheque
   * Validates data and sets initial status
   */
  async createCheque(tenantId: string, userId: string, data: CreateChequeDto): Promise<Cheque> {
    // Validate amount
    if (!data.amountSYP || data.amountSYP <= 0) {
      throw new Error('Valid amountSYP is required');
    }

    // Validate cheque type
    if (data.chequeType === ChequeType.RECEIVED && !data.customerId) {
      throw new Error('Customer ID is required for received cheques');
    }
    if (data.chequeType === ChequeType.ISSUED && !data.supplierId) {
      throw new Error('Supplier ID is required for issued cheques');
    }

    // Validate customer/supplier exists if provided
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId },
      });
      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    if (data.supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: data.supplierId, tenantId },
      });
      if (!supplier) {
        throw new Error('Supplier not found');
      }
    }

    // Validate invoice exists if provided
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, tenantId },
      });
      if (!invoice) {
        throw new Error('Invoice not found');
      }
    }

    // Validate payment exists if provided
    if (data.paymentId) {
      const payment = await prisma.payment.findFirst({
        where: { id: data.paymentId, tenantId },
      });
      if (!payment) {
        throw new Error('Payment not found');
      }
    }

    // Validate dates
    if (data.issueDate > data.dueDate) {
      throw new Error('Issue date cannot be after due date');
    }

    const currency = data.currency || 'SYP';

    // Generate cheque number if not provided
    const chequeNumber = data.chequeNumber || `CHQ-${Date.now()}`;

    // Create cheque
    const cheque = await prisma.cheque.create({
      data: {
        tenantId,
        chequeNumber,
        type: data.chequeType,
        bankName: data.bankName,
        branchName: data.bankBranch,
        bankBranch: data.bankBranch,
        accountNumber: data.accountNumber,
        amountSYP: data.amountSYP,
        amountUSD: data.amountUSD || (currency === 'USD' ? data.amountSYP : null),
        currency,
        customerId: data.customerId,
        supplierId: data.supplierId,
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
        chequeDate: data.issueDate || new Date(),
        dueDate: data.dueDate,
        status: ChequeStatus.PENDING,
        notes: data.notes,
      },
    });

    // Create initial transaction
    await this.createChequeTransaction(tenantId, userId, {
      chequeId: cheque.id,
      transactionType: 'TRANSFER',
      transactionDate: data.issueDate,
      amountSYP: data.amountSYP,
      amountUSD: data.amountUSD || (currency === 'USD' ? data.amountSYP : undefined),
      notes: 'Cheque created',
    });

    return this.mapToChequeResponse(cheque);
  }

  /**
   * Get all cheques with optional filters
   */
  async getCheques(tenantId: string, filters: ChequeFilters = {}): Promise<Cheque[]> {
    const where: any = { tenantId };

    if (filters.chequeType) {
      where.type = filters.chequeType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }
    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }
    if (filters.bankName) {
      where.bankName = { contains: filters.bankName, mode: 'insensitive' };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.chequeDate = {};
      if (filters.dateFrom) {
        where.issueDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.chequeDate.lte = filters.dateTo;
      }
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) {
        where.dueDate.gte = filters.dueDateFrom;
      }
      if (filters.dueDateTo) {
        where.dueDate.lte = filters.dueDateTo;
      }
    }
    if (filters.search) {
      where.OR = [
        { chequeNumber: { contains: filters.search, mode: 'insensitive' } },
        { bankName: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const cheques = await prisma.cheque.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { chequeDate: 'desc' }],
    });

    return cheques.map((cheque) => this.mapToChequeResponse(cheque));
  }

  /**
   * Get cheque by ID
   */
  async getChequeById(tenantId: string, chequeId: string): Promise<Cheque | null> {
    const cheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
      include: {
        transactions: true,
      },
    });

    if (!cheque) {
      return null;
    }

    return this.mapToChequeResponse(cheque);
  }

  /**
   * Update cheque
   * Only allowed if status is PENDING
   */
  async updateCheque(tenantId: string, chequeId: string, data: UpdateChequeDto): Promise<Cheque> {
    const existingCheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
    });

    if (!existingCheque) {
      throw new Error('Cheque not found');
    }

    // Only allow updates to pending cheques
    if (existingCheque.status !== ChequeStatus.PENDING) {
      throw new Error('Cannot update a cheque that is not in PENDING status');
    }

    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        ...(data.bankName && { bankName: data.bankName }),
        ...(data.bankBranch !== undefined && { branchName: data.bankBranch }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return this.mapToChequeResponse(updatedCheque);
  }

  /**
   * Deposit cheque (for received cheques)
   * Creates automatic journal entry
   */
  async depositCheque(tenantId: string, chequeId: string, userId: string): Promise<Cheque> {
    const cheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.type !== ChequeType.RECEIVED) {
      throw new Error('Can only deposit received cheques');
    }

    if (cheque.status !== ChequeStatus.PENDING) {
      throw new Error('Cheque is not in PENDING status');
    }

    // Update status
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: { status: ChequeStatus.DEPOSITED },
    });

    // Create transaction
    const transaction = await this.createChequeTransaction(tenantId, userId, {
      chequeId: cheque.id,
      transactionType: 'DEPOSITED',
      transactionDate: new Date(),
      amountSYP: Number(cheque.amountSYP),
      amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : undefined,
      notes: 'Cheque deposited to bank',
    });

    // Create automatic journal entry
    try {
      await createChequeDepositJournalEntry(cheque, transaction, tenantId, userId);
    } catch (error) {
      Logger.error('Failed to create automatic journal entry for cheque deposit:', error);
      throw new Error('Cheque deposited but journal entry creation failed. Please check the chart of accounts setup.');
    }

    // Send notification
    this.sendNotification(tenantId, cheque.customerId, 'Cheque Deposited', `Cheque ${cheque.chequeNumber} has been deposited`);

    return this.mapToChequeResponse(updatedCheque);
  }

  /**
   * Clear cheque (mark as cleared by bank)
   * Creates automatic journal entry
   */
  async clearCheque(tenantId: string, chequeId: string, userId: string): Promise<Cheque> {
    const cheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status !== ChequeStatus.DEPOSITED) {
      throw new Error('Cheque must be deposited before clearing');
    }

    // Update status
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: { 
        status: ChequeStatus.CLEARED,
        clearedAt: new Date(),
      },
    });

    // Create transaction
    const transaction = await this.createChequeTransaction(tenantId, userId, {
      chequeId: cheque.id,
      transactionType: 'CLEARED',
      transactionDate: new Date(),
      amountSYP: Number(cheque.amountSYP),
      amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : undefined,
      notes: 'Cheque cleared by bank',
    });

    // Create automatic journal entry
    try {
      await createChequeClearanceJournalEntry(cheque, transaction, tenantId, userId);
    } catch (error) {
      Logger.error('Failed to create automatic journal entry for cheque clearance:', error);
      throw new Error('Cheque cleared but journal entry creation failed. Please check the chart of accounts setup.');
    }

    // Send notification
    this.sendNotification(tenantId, cheque.customerId || cheque.supplierId, 'Cheque Cleared', `Cheque ${cheque.chequeNumber} has been cleared`);

    return this.mapToChequeResponse(updatedCheque);
  }

  /**
   * Bounce cheque (mark as returned/bounced)
   */
  async bounceCheque(tenantId: string, chequeId: string, userId: string, notes?: string): Promise<Cheque> {
    const cheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status === ChequeStatus.BOUNCED) {
      throw new Error('Cheque is already bounced');
    }

    // Update status
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: { 
        status: ChequeStatus.BOUNCED,
        bouncedAt: new Date(),
        bouncedReason: notes,
      },
    });

    // Create transaction
    await this.createChequeTransaction(tenantId, userId, {
      chequeId: cheque.id,
      transactionType: 'BOUNCED',
      transactionDate: new Date(),
      amountSYP: Number(cheque.amountSYP),
      amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : undefined,
      notes: notes || 'Cheque bounced by bank',
    });

    // Send notification
    this.sendNotification(tenantId, cheque.customerId || cheque.supplierId, 'Cheque Bounced', `Cheque ${cheque.chequeNumber} has been bounced. Please take action.`);

    return this.mapToChequeResponse(updatedCheque);
  }

  /**
   * Cancel cheque
   */
  async cancelCheque(tenantId: string, chequeId: string, userId: string): Promise<Cheque> {
    const cheque = await prisma.cheque.findFirst({
      where: { id: chequeId, tenantId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.status === ChequeStatus.CANCELLED) {
      throw new Error('Cheque is already cancelled');
    }

    // Update status
    const updatedCheque = await prisma.cheque.update({
      where: { id: chequeId },
      data: { status: ChequeStatus.CANCELLED },
    });

    // Create transaction
    await this.createChequeTransaction(tenantId, userId, {
      chequeId: cheque.id,
      transactionType: 'CANCELLED',
      transactionDate: new Date(),
      amountSYP: Number(cheque.amountSYP),
      amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : undefined,
      notes: 'Cheque cancelled',
    });

    return this.mapToChequeResponse(updatedCheque);
  }

  /**
   * Get cheques due soon (within 3 days)
   */
  async getChequesDueSoon(tenantId: string): Promise<Cheque[]> {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const cheques = await prisma.cheque.findMany({
      where: {
        tenantId,
        status: ChequeStatus.PENDING,
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    return cheques.map((cheque) => this.mapToChequeResponse(cheque));
  }

  /**
   * Get overdue cheques
   */
  async getOverdueCheques(tenantId: string): Promise<Cheque[]> {
    const today = new Date();

    const cheques = await prisma.cheque.findMany({
      where: {
        tenantId,
        status: ChequeStatus.PENDING,
        dueDate: { lt: today },
      },
      orderBy: [{ dueDate: 'asc' }],
    });

    return cheques.map((cheque) => this.mapToChequeResponse(cheque));
  }

  /**
   * Create cheque transaction
   */
  async createChequeTransaction(tenantId: string, userId: string, data: CreateChequeTransactionDto): Promise<ChequeTransaction> {
    // Validate cheque exists
    const cheque = await prisma.cheque.findFirst({
      where: { id: data.chequeId, tenantId },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    const transaction = await prisma.chequeTransaction.create({
      data: {
        tenantId,
        chequeId: data.chequeId,
        transactionType: data.transactionType as any,
        transactionDate: data.transactionDate,
        amountSYP: data.amountSYP || cheque.amountSYP,
        amountUSD: data.amountUSD || cheque.amountUSD,
        description: data.notes,
      },
      include: {
        cheque: true,
      },
    });

    return this.mapToChequeTransactionResponse(transaction);
  }

  /**
   * Get cheque transactions
   */
  async getChequeTransactions(tenantId: string, chequeId: string): Promise<ChequeTransaction[]> {
    const transactions = await prisma.chequeTransaction.findMany({
      where: { tenantId, chequeId },
      include: { cheque: true },
      orderBy: { transactionDate: 'desc' },
    });

    return transactions.map((tx) => this.mapToChequeTransactionResponse(tx));
  }

  /**
   * Get cheque summaries (for list views)
   */
  async getChequeSummaries(tenantId: string, filters: ChequeFilters = {}): Promise<ChequeSummary[]> {
    const where: any = { tenantId };

    if (filters.chequeType) {
      where.chequeType = filters.chequeType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    const cheques = await prisma.cheque.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { chequeDate: 'desc' }],
    });

    const today = new Date();

    return cheques.map((cheque) => {
      const dueDate = new Date(cheque.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: cheque.id,
        chequeNumber: cheque.chequeNumber,
        type: cheque.type,
        bankName: cheque.bankName,
        amountSYP: Number(cheque.amountSYP),
        amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : null,
        currency: cheque.currency,
        dueDate: cheque.dueDate,
        status: cheque.status,
        daysUntilDue,
      };
    });
  }

  /**
   * Send notification via Socket.io
   */
  private sendNotification(tenantId: string, userId: string | null, title: string, message: string): void {
    if (this.io && userId) {
      this.io.to(`user:${userId}`).emit('notification', {
        type: 'CHEQUE',
        title,
        message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Map Prisma cheque to Cheque response
   */
  private mapToChequeResponse(cheque: any): Cheque {
    return {
      id: cheque.id,
      tenantId: cheque.tenantId,
      chequeNumber: cheque.chequeNumber,
      type: cheque.type,
      bankName: cheque.bankName,
      branchName: cheque.branchName,
      bankBranch: cheque.bankBranch,
      accountNumber: cheque.accountNumber,
      amountSYP: cheque.amountSYP ? Number(cheque.amountSYP) : 0,
      amountUSD: cheque.amountUSD ? Number(cheque.amountUSD) : null,
      currency: cheque.currency,
      chequeDate: cheque.chequeDate,
      dueDate: cheque.dueDate,
      customerId: cheque.customerId,
      supplierId: cheque.supplierId,
      invoiceId: cheque.invoiceId,
      paymentId: cheque.paymentId,
      status: cheque.status,
      notes: cheque.notes,
      issuerName: cheque.issuerName,
      receiverName: cheque.receiverName,
      bouncedAt: cheque.bouncedAt,
      bouncedReason: cheque.bouncedReason,
      clearedAt: cheque.clearedAt,
      createdAt: cheque.createdAt,
      updatedAt: cheque.updatedAt,
    };
  }

  /**
   * Map Prisma cheque transaction to ChequeTransaction response
   */
  private mapToChequeTransactionResponse(transaction: any): ChequeTransaction {
    return {
      id: transaction.id,
      tenantId: transaction.tenantId,
      chequeId: transaction.chequeId,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      amountSYP: transaction.amountSYP ? Number(transaction.amountSYP) : 0,
      amountUSD: transaction.amountUSD ? Number(transaction.amountUSD) : null,
      notes: transaction.notes,
      bankFeeSYP: transaction.bankFeeSYP ? Number(transaction.bankFeeSYP) : 0,
      bankFeeUSD: transaction.bankFeeUSD ? Number(transaction.bankFeeUSD) : null,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
      cheque: transaction.cheque ? this.mapToChequeResponse(transaction.cheque) : undefined,
    };
  }
}