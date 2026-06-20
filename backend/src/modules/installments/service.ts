import prisma from '../../config/database';
import {
  Installment,
  InstallmentPlan,
  CreateInstallmentDto,
  CreateInstallmentPlanDto,
  UpdateInstallmentPlanDto,
  InstallmentPlanFilters,
  InstallmentSummary,
} from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { InstallmentStatus, InstallmentPaymentStatus } from '@prisma/client';
import { createInstallmentPaymentJournalEntry } from '../accounting/automatic-journal-entries';
import { WhatsAppService } from '../whatsapp/service';

export class InstallmentService {
  private io: any;
  private whatsappService: WhatsAppService;

  constructor(io?: any) {
    this.io = io;
    this.whatsappService = new WhatsAppService();
    if (io) {
      this.whatsappService.setIo(io);
    }
  }

  setIo(io: any) {
    this.io = io;
    this.whatsappService.setIo(io);
  }

  /**
   * Create a new installment plan
   * Calculates installment amounts and creates schedule
   */
  async createInstallmentPlan(tenantId: string, userId: string, data: CreateInstallmentPlanDto): Promise<InstallmentPlan> {
    // Validate that at least one reference is provided
    if (!data.customerId && !data.supplierId && !data.invoiceId) {
      throw new Error('Installment plan must be linked to a customer, supplier, or invoice');
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

    // Handle and validate start date
    let startDate: Date;
    if (typeof data.startDate === 'string') {
      startDate = new Date(data.startDate);
    } else if (data.startDate instanceof Date) {
      startDate = data.startDate;
    } else {
      startDate = new Date();
    }

    // Validate start date
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }

    const currency = data.currency || 'SYP';
    const downPaymentSYP = data.downPaymentSYP || 0;
    const downPaymentUSD = data.downPaymentUSD || 0;
    const interestRate = data.interestRate || 0;

    // Calculate interest amount
    const principalSYP = data.totalAmountSYP - downPaymentSYP;
    const interestAmountSYP = principalSYP * (interestRate / 100);
    const totalWithInterestSYP = principalSYP + interestAmountSYP;

    const principalUSD = data.totalAmountUSD ? data.totalAmountUSD - downPaymentUSD : 0;
    const interestAmountUSD = principalUSD * (interestRate / 100);
    const totalWithInterestUSD = principalUSD + interestAmountUSD;

    // Calculate installment amount
    const installmentAmountSYP = totalWithInterestSYP / data.numberOfPayments;
    const installmentAmountUSD = totalWithInterestUSD / data.numberOfPayments;

    // Calculate end date based on frequency
    const endDate = this.calculateEndDate(startDate, data.numberOfPayments, data.paymentFrequency);

    // Generate plan number
    const planNumber = `INST-${Date.now()}`;

    // Create installment plan with installments in a transaction
    const plan = await prisma.$transaction(async (tx) => {
      // Create plan
      const createdPlan = await tx.installmentPlan.create({
        data: {
          tenantId,
          planNumber,
          customerId: data.customerId,
          supplierId: data.supplierId,
          invoiceId: data.invoiceId || null,
          totalAmountSYP: data.totalAmountSYP,
          totalAmountUSD: data.totalAmountUSD,
          downPaymentSYP,
          downPaymentUSD,
          downPaymentPaidSYP: 0,
          downPaymentPaidUSD: 0,
          remainingAmountSYP: data.totalAmountSYP,
          remainingAmountUSD: data.totalAmountUSD,
          numberOfPayments: data.numberOfPayments,
          interestRate,
          interestAmountSYP,
          interestAmountUSD,
          paymentFrequency: data.paymentFrequency,
          currency,
          startDate,
          endDate,
          status: InstallmentStatus.ACTIVE,
          notes: data.notes,
          createdBy: userId,
        },
      });

      // Create installments
      const installments = [];
      for (let i = 1; i <= data.numberOfPayments; i++) {
        const dueDate = this.calculateInstallmentDueDate(startDate, i, data.paymentFrequency);

        const installment = await tx.installment.create({
          data: {
            installmentPlanId: createdPlan.id,
            sequenceNumber: i,
            dueDate,
            amountSYP: installmentAmountSYP,
            amountUSD: installmentAmountUSD || null,
            paidSYP: 0,
            paidUSD: 0,
            status: InstallmentPaymentStatus.PENDING,
          },
        });

        installments.push(installment);
      }

      return { plan: createdPlan, installments };
    });

    return this.mapToInstallmentPlanResponse(plan.plan, plan.installments);
  }

  /**
   * Get all installment plans with optional filters
   */
  async getInstallmentPlans(tenantId: string, filters: InstallmentPlanFilters = {}): Promise<InstallmentPlan[]> {
    const where: any = { tenantId };

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
    if (filters.dateFrom || filters.dateTo) {
      where.startDate = {};
      if (filters.dateFrom) {
        where.startDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.startDate.lte = filters.dateTo;
      }
    }
    if (filters.search) {
      where.OR = [
        { planNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const plans = await prisma.installmentPlan.findMany({
      where,
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: [{ startDate: 'desc' }, { planNumber: 'desc' }],
    });

    return plans.map((plan) => this.mapToInstallmentPlanResponse(plan, plan.installments));
  }

  /**
   * Get installment plan by ID
   */
  async getInstallmentPlanById(tenantId: string, planId: string): Promise<InstallmentPlan | null> {
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, tenantId },
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!plan) {
      return null;
    }

    return this.mapToInstallmentPlanResponse(plan, plan.installments);
  }

  /**
   * Update installment plan
   * Only allowed if status is ACTIVE
   */
  async updateInstallmentPlan(tenantId: string, planId: string, data: UpdateInstallmentPlanDto): Promise<InstallmentPlan> {
    const existingPlan = await prisma.installmentPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!existingPlan) {
      throw new Error('Installment plan not found');
    }

    // Only allow updates to active plans
    if (existingPlan.status !== InstallmentStatus.ACTIVE) {
      throw new Error('Cannot update a plan that is not in ACTIVE status');
    }

    const updatedPlan = await prisma.installmentPlan.update({
      where: { id: planId },
      data: {
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return this.mapToInstallmentPlanResponse(updatedPlan, updatedPlan.installments);
  }

  /**
   * Pay down payment
   */
  async payDownPayment(tenantId: string, planId: string, amountSYP: number, amountUSD: number | undefined, userId: string): Promise<InstallmentPlan> {
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new Error('Installment plan not found');
    }

    if (plan.status !== InstallmentStatus.ACTIVE) {
      throw new Error('Cannot pay down payment for inactive plan');
    }

    const remainingDownPaymentSYP = Number(plan.downPaymentSYP) - Number(plan.downPaymentPaidSYP);
    if (amountSYP > remainingDownPaymentSYP) {
      throw new Error(`Down payment amount exceeds remaining amount: ${remainingDownPaymentSYP}`);
    }

    // Update down payment paid
    const newDownPaymentPaidSYP = Number(plan.downPaymentPaidSYP) + amountSYP;
    const newDownPaymentPaidUSD = amountUSD ? Number(plan.downPaymentPaidUSD || 0) + amountUSD : Number(plan.downPaymentPaidUSD || 0);
    const newRemainingAmountSYP = Number(plan.remainingAmountSYP) - amountSYP;
    const newRemainingAmountUSD = amountUSD ? Number(plan.remainingAmountUSD || 0) - amountUSD : Number(plan.remainingAmountUSD || 0);

    const updatedPlan = await prisma.installmentPlan.update({
      where: { id: planId },
      data: {
        downPaymentPaidSYP: newDownPaymentPaidSYP,
        downPaymentPaidUSD: newDownPaymentPaidUSD,
        remainingAmountSYP: newRemainingAmountSYP,
        remainingAmountUSD: newRemainingAmountUSD,
      },
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    // Check if plan is fully paid
    if (newRemainingAmountSYP <= 0) {
      await this.completePlan(tenantId, planId, userId);
    }

    return this.mapToInstallmentPlanResponse(updatedPlan, updatedPlan.installments);
  }

  /**
   * Pay installment
   * Creates automatic journal entry
   */
  async payInstallment(tenantId: string, installmentId: string, amountSYP: number, amountUSD: number | undefined, userId: string, paymentId: string | undefined): Promise<Installment> {
    const installment = await prisma.installment.findFirst({
      where: { id: installmentId },
      include: { installmentPlan: true },
    });

    if (!installment) {
      throw new Error('Installment not found');
    }

    if (installment.status !== InstallmentPaymentStatus.PENDING) {
      throw new Error('Installment is not in PENDING status');
    }

    const remainingAmountSYP = Number(installment.amountSYP) - Number(installment.paidSYP);
    if (amountSYP > remainingAmountSYP) {
      throw new Error(`Payment amount exceeds remaining amount: ${remainingAmountSYP}`);
    }

    // Update installment
    const newPaidSYP = Number(installment.paidSYP) + amountSYP;
    const newPaidUSD = amountUSD ? Number(installment.paidUSD || 0) + amountUSD : Number(installment.paidUSD || 0);
    const isFullyPaid = newPaidSYP >= Number(installment.amountSYP);

    const updatedInstallment = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        paidSYP: newPaidSYP,
        paidUSD: newPaidUSD,
        status: isFullyPaid ? InstallmentPaymentStatus.PAID : InstallmentPaymentStatus.PENDING,
        paidAt: isFullyPaid ? new Date() : null,
      },
      include: { installmentPlan: true },
    });

    // Update plan remaining amount
    const plan = await prisma.installmentPlan.update({
      where: { id: installment.installmentPlanId },
      data: {
        remainingAmountSYP: { decrement: amountSYP },
        ...(amountUSD && { remainingAmountUSD: { decrement: amountUSD } }),
      },
    });

    // Create automatic journal entry when installment is fully paid
    if (isFullyPaid) {
      try {
        await createInstallmentPaymentJournalEntry(updatedInstallment, tenantId, userId);
      } catch (error) {
        Logger.error('Failed to create automatic journal entry for installment payment:', error);
        throw new Error('Installment payment recorded but journal entry creation failed. Please check the chart of accounts setup.');
      }

      // Send WhatsApp notification for payment confirmation
      try {
        if (installment.installmentPlan.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: installment.installmentPlan.customerId },
            select: { fullName: true, phone: true },
          });

          if (customer) {
            await this.whatsappService.sendPaymentConfirmation({
              customerName: customer.fullName,
              customerPhone: customer.phone,
              invoiceNumber: installment.installmentPlan.planNumber,
              totalAmount: Number(installment.amountSYP),
              dueDate: installment.dueDate ? installment.dueDate.toString() : '',
              garageName: 'Garage Go',
            });
          }
        }
      } catch (error) {
        Logger.error('Error sending WhatsApp notification:', error);
        // Don't fail the payment if WhatsApp fails
      }
    }

    // Check if all installments are paid
    const allInstallments = await prisma.installment.findMany({
      where: { installmentPlanId: installment.installmentPlanId },
    });

    const allPaid = allInstallments.every((inst) => inst.status === InstallmentPaymentStatus.PAID);
    if (allPaid) {
      await this.completePlan(tenantId, installment.installmentPlanId, userId);
    }

    return this.mapToInstallmentResponse(updatedInstallment);
  }

  /**
   * Complete installment plan
   */
  async completePlan(tenantId: string, planId: string, userId: string): Promise<InstallmentPlan> {
    const plan = await prisma.installmentPlan.update({
      where: { id: planId },
      data: {
        status: InstallmentStatus.COMPLETED,
        remainingAmountSYP: 0,
        remainingAmountUSD: 0,
      },
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    // Send notification
    this.sendNotification(tenantId, plan.customerId || plan.supplierId, 'Installment Plan Completed', `Installment plan ${plan.planNumber} has been fully paid`);

    return this.mapToInstallmentPlanResponse(plan, plan.installments);
  }

  /**
   * Cancel installment plan
   */
  async cancelInstallmentPlan(tenantId: string, planId: string): Promise<InstallmentPlan> {
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, tenantId },
    });

    if (!plan) {
      throw new Error('Installment plan not found');
    }

    if (plan.status === InstallmentStatus.CANCELLED) {
      throw new Error('Installment plan is already cancelled');
    }

    const cancelledPlan = await prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: InstallmentStatus.CANCELLED },
      include: {
        installments: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return this.mapToInstallmentPlanResponse(cancelledPlan, cancelledPlan.installments);
  }

  /**
   * Get overdue installments
   */
  async getOverdueInstallments(tenantId: string): Promise<Installment[]> {
    const today = new Date();

    const installments = await prisma.installment.findMany({
      where: {
        status: InstallmentPaymentStatus.PENDING,
        dueDate: { lt: today },
      },
      include: { installmentPlan: true },
      orderBy: { dueDate: 'asc' },
    });

    return installments.map((inst) => this.mapToInstallmentResponse(inst));
  }

  /**
   * Get installments due soon (within 7 days)
   */
  async getInstallmentsDueSoon(tenantId: string): Promise<Installment[]> {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const installments = await prisma.installment.findMany({
      where: {
        status: InstallmentPaymentStatus.PENDING,
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      include: { installmentPlan: true },
      orderBy: { dueDate: 'asc' },
    });

    return installments.map((inst) => this.mapToInstallmentResponse(inst));
  }

  /**
   * Get installment plan summaries (for list views)
   */
  async getInstallmentPlanSummaries(tenantId: string, filters: InstallmentPlanFilters = {}): Promise<InstallmentSummary[]> {
    const where: any = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    const plans = await prisma.installmentPlan.findMany({
      where,
      include: {
        installments: {
          where: { status: InstallmentPaymentStatus.PENDING },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: [{ startDate: 'desc' }, { planNumber: 'desc' }],
    });

    return plans.map((plan) => {
      const paidInstallments = plan.installments.filter((inst: any) => inst.status === InstallmentPaymentStatus.PAID).length;
      const nextInstallment = plan.installments.find((inst: any) => inst.status === InstallmentPaymentStatus.PENDING);

      return {
        id: plan.id,
        planNumber: plan.planNumber,
        customerId: plan.customerId,
        supplierId: plan.supplierId,
        invoiceId: plan.invoiceId,
        totalAmountSYP: Number(plan.totalAmountSYP),
        downPaymentSYP: Number(plan.downPaymentSYP),
        downPaymentPaidSYP: Number(plan.downPaymentPaidSYP),
        remainingAmountSYP: Number(plan.remainingAmountSYP),
        numberOfPayments: plan.numberOfPayments,
        paidInstallments,
        paymentFrequency: plan.paymentFrequency,
        currency: plan.currency,
        status: plan.status,
        nextPaymentDate: nextInstallment?.dueDate,
        nextPaymentAmount: nextInstallment ? Number(nextInstallment.amountSYP) : undefined,
      };
    });
  }

  /**
   * Calculate end date based on frequency
   */
  private calculateEndDate(startDate: Date, numberOfInstallments: number, frequency: string): Date {
    const endDate = new Date(startDate);
    
    // Validate start date
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date provided');
    }
    
    switch (frequency) {
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + (numberOfInstallments * 7));
        break;
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + numberOfInstallments);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + (numberOfInstallments * 3));
        break;
      default:
        endDate.setMonth(endDate.getMonth() + numberOfInstallments);
    }

    // Validate the calculated date
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid end date calculated');
    }

    return endDate;
  }

  /**
   * Calculate installment due date
   */
  private calculateInstallmentDueDate(startDate: Date, installmentNumber: number, frequency: string): Date {
    const dueDate = new Date(startDate);
    
    // Validate start date
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date provided');
    }
    
    switch (frequency) {
      case 'WEEKLY':
        dueDate.setDate(dueDate.getDate() + (installmentNumber * 7));
        break;
      case 'MONTHLY':
        dueDate.setMonth(dueDate.getMonth() + installmentNumber);
        break;
      case 'QUARTERLY':
        dueDate.setMonth(dueDate.getMonth() + (installmentNumber * 3));
        break;
      default:
        dueDate.setMonth(dueDate.getMonth() + installmentNumber);
    }

    // Validate the calculated date
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date calculated');
    }

    return dueDate;
  }

  /**
   * Send notification via Socket.io
   */
  private sendNotification(tenantId: string, userId: string | null, title: string, message: string): void {
    if (this.io && userId) {
      this.io.to(`user:${userId}`).emit('notification', {
        type: 'INSTALLMENT',
        title,
        message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Map Prisma installment plan to InstallmentPlan response
   */
  private mapToInstallmentPlanResponse(plan: any, installments: any[]): InstallmentPlan {
    return {
      id: plan.id,
      tenantId: plan.tenantId,
      customerId: plan.customerId,
      supplierId: plan.supplierId,
      invoiceId: plan.invoiceId,
      planNumber: plan.planNumber,
      totalAmountSYP: Number(plan.totalAmountSYP),
      totalAmountUSD: plan.totalAmountUSD ? Number(plan.totalAmountUSD) : null,
      downPaymentSYP: Number(plan.downPaymentSYP),
      downPaymentUSD: plan.downPaymentUSD ? Number(plan.downPaymentUSD) : null,
      downPaymentPaidSYP: Number(plan.downPaymentPaidSYP),
      downPaymentPaidUSD: plan.downPaymentPaidUSD ? Number(plan.downPaymentPaidUSD) : null,
      remainingAmountSYP: Number(plan.remainingAmountSYP),
      remainingAmountUSD: plan.remainingAmountUSD ? Number(plan.remainingAmountUSD) : null,
      numberOfPayments: plan.numberOfPayments,
      interestRate: Number(plan.interestRate),
      interestAmountSYP: Number(plan.interestAmountSYP),
      interestAmountUSD: plan.interestAmountUSD ? Number(plan.interestAmountUSD) : null,
      paymentFrequency: plan.paymentFrequency,
      currency: plan.currency,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      notes: plan.notes,
      createdBy: plan.createdBy,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      installments: installments.map((inst) => this.mapToInstallmentResponse(inst)),
    };
  }

  /**
   * Map Prisma installment to Installment response
   */
  private mapToInstallmentResponse(installment: any): Installment {
    return {
      id: installment.id,
      installmentPlanId: installment.installmentPlanId,
      sequenceNumber: installment.sequenceNumber,
      dueDate: installment.dueDate,
      amountSYP: Number(installment.amountSYP),
      amountUSD: installment.amountUSD ? Number(installment.amountUSD) : null,
      paidSYP: Number(installment.paidSYP),
      paidUSD: Number(installment.paidUSD),
      status: installment.status,
      paidAt: installment.paidAt,
      reminderSentAt: installment.reminderSentAt,
      installmentPlan: installment.installmentPlan,
    };
  }
}