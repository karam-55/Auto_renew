import prisma from '../../config/database';
import { CreatePayrollRecordInput, UpdatePayrollRecordInput, PayrollRecordResponse } from './types';
import { Logger } from '../../infrastructure/logging/logger';
import { createPayrollJournalEntry } from '../accounting/automatic-journal-entries';

export class PayrollService {
  async getAllPayrollRecords(tenantId: string, page: number = 1, limit: number = 50): Promise<{ payrollRecords: PayrollRecordResponse[], total: number }> {
    const skip = (page - 1) * limit;

    const [payrollRecords, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where: { tenantId },
        select: {
          id: true,
          tenantId: true,
          employeeId: true,
          periodStart: true,
          periodEnd: true,
          basicSalarySYP: true,
          basicSalaryUSD: true,
          overtimeSYP: true,
          overtimeUSD: true,
          bonusesSYP: true,
          bonusesUSD: true,
          deductionsSYP: true,
          deductionsUSD: true,
          netSalarySYP: true,
          netSalaryUSD: true,
          status: true,
          paidAt: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { periodStart: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payrollRecord.count({ where: { tenantId } }),
    ]);

    return {
      payrollRecords: payrollRecords.map(p => ({
        ...p,
        basicSalarySYP: Number(p.basicSalarySYP),
        basicSalaryUSD: p.basicSalaryUSD ? Number(p.basicSalaryUSD) : undefined,
        overtimeSYP: Number(p.overtimeSYP),
        overtimeUSD: p.overtimeUSD ? Number(p.overtimeUSD) : undefined,
        bonusesSYP: Number(p.bonusesSYP),
        bonusesUSD: p.bonusesUSD ? Number(p.bonusesUSD) : undefined,
        deductionsSYP: Number(p.deductionsSYP),
        deductionsUSD: p.deductionsUSD ? Number(p.deductionsUSD) : undefined,
        netSalarySYP: Number(p.netSalarySYP),
        netSalaryUSD: p.netSalaryUSD ? Number(p.netSalaryUSD) : undefined,
      })),
      total,
    };
  }

  async getPayrollRecordById(tenantId: string, payrollId: string): Promise<PayrollRecordResponse | null> {
    const payrollRecord = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, tenantId },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payrollRecord) return null;
    return {
      ...payrollRecord,
      basicSalarySYP: Number(payrollRecord.basicSalarySYP),
      basicSalaryUSD: payrollRecord.basicSalaryUSD ? Number(payrollRecord.basicSalaryUSD) : undefined,
      overtimeSYP: Number(payrollRecord.overtimeSYP),
      overtimeUSD: payrollRecord.overtimeUSD ? Number(payrollRecord.overtimeUSD) : undefined,
      bonusesSYP: Number(payrollRecord.bonusesSYP),
      bonusesUSD: payrollRecord.bonusesUSD ? Number(payrollRecord.bonusesUSD) : undefined,
      deductionsSYP: Number(payrollRecord.deductionsSYP),
      deductionsUSD: payrollRecord.deductionsUSD ? Number(payrollRecord.deductionsUSD) : undefined,
      netSalarySYP: Number(payrollRecord.netSalarySYP),
      netSalaryUSD: payrollRecord.netSalaryUSD ? Number(payrollRecord.netSalaryUSD) : undefined,
    };
  }

  async getPayrollRecordsByEmployee(tenantId: string, employeeId: string): Promise<PayrollRecordResponse[]> {
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: { tenantId, employeeId },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { periodStart: 'desc' },
    });

    return payrollRecords.map(p => ({
      ...p,
      basicSalarySYP: Number(p.basicSalarySYP),
      basicSalaryUSD: p.basicSalaryUSD ? Number(p.basicSalaryUSD) : undefined,
      overtimeSYP: Number(p.overtimeSYP),
      overtimeUSD: p.overtimeUSD ? Number(p.overtimeUSD) : undefined,
      bonusesSYP: Number(p.bonusesSYP),
      bonusesUSD: p.bonusesUSD ? Number(p.bonusesUSD) : undefined,
      deductionsSYP: Number(p.deductionsSYP),
      deductionsUSD: p.deductionsUSD ? Number(p.deductionsUSD) : undefined,
      netSalarySYP: Number(p.netSalarySYP),
      netSalaryUSD: p.netSalaryUSD ? Number(p.netSalaryUSD) : undefined,
    }));
  }

  async getPayrollRecordsByPeriod(tenantId: string, periodStart: Date, periodEnd: Date): Promise<PayrollRecordResponse[]> {
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: {
        tenantId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { periodStart: 'desc' },
    });

    return payrollRecords.map(p => ({
      ...p,
      basicSalarySYP: Number(p.basicSalarySYP),
      basicSalaryUSD: p.basicSalaryUSD ? Number(p.basicSalaryUSD) : undefined,
      overtimeSYP: Number(p.overtimeSYP),
      overtimeUSD: p.overtimeUSD ? Number(p.overtimeUSD) : undefined,
      bonusesSYP: Number(p.bonusesSYP),
      bonusesUSD: p.bonusesUSD ? Number(p.bonusesUSD) : undefined,
      deductionsSYP: Number(p.deductionsSYP),
      deductionsUSD: p.deductionsUSD ? Number(p.deductionsUSD) : undefined,
      netSalarySYP: Number(p.netSalarySYP),
      netSalaryUSD: p.netSalaryUSD ? Number(p.netSalaryUSD) : undefined,
    }));
  }

  async createPayrollRecord(tenantId: string, data: CreatePayrollRecordInput): Promise<PayrollRecordResponse> {
    // Verify employee exists and belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, tenantId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if payroll record already exists for this employee in this period
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: {
        employeeId: data.employeeId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
    });

    if (existingPayroll) {
      throw new Error('Payroll record already exists for this employee in this period');
    }

    // Calculate net salary if not provided
    const basicSalarySYP = data.basicSalarySYP ?? Number(employee.salarySYP);
    const basicSalaryUSD = data.basicSalaryUSD ?? (employee.salaryUSD ? Number(employee.salaryUSD) : undefined);
    const overtimeSYP = data.overtimeSYP ?? 0;
    const overtimeUSD = data.overtimeUSD ?? 0;
    const bonusesSYP = data.bonusesSYP ?? 0;
    const bonusesUSD = data.bonusesUSD ?? 0;
    const deductionsSYP = data.deductionsSYP ?? 0;
    const deductionsUSD = data.deductionsUSD ?? 0;

    const netSalarySYP = data.netSalarySYP ?? (basicSalarySYP + overtimeSYP + bonusesSYP - deductionsSYP);
    const netSalaryUSD = data.netSalaryUSD ?? (basicSalaryUSD && overtimeUSD && bonusesUSD && deductionsUSD
      ? basicSalaryUSD + overtimeUSD + bonusesUSD - deductionsUSD
      : undefined);

    const payrollRecord = await prisma.payrollRecord.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        basicSalarySYP,
        basicSalaryUSD,
        overtimeSYP,
        overtimeUSD,
        bonusesSYP,
        bonusesUSD,
        deductionsSYP,
        deductionsUSD,
        netSalarySYP,
        netSalaryUSD,
        status: data.status ?? 'DRAFT',
        notes: data.notes,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...payrollRecord,
      basicSalarySYP: Number(payrollRecord.basicSalarySYP),
      basicSalaryUSD: payrollRecord.basicSalaryUSD ? Number(payrollRecord.basicSalaryUSD) : undefined,
      overtimeSYP: Number(payrollRecord.overtimeSYP),
      overtimeUSD: payrollRecord.overtimeUSD ? Number(payrollRecord.overtimeUSD) : undefined,
      bonusesSYP: Number(payrollRecord.bonusesSYP),
      bonusesUSD: payrollRecord.bonusesUSD ? Number(payrollRecord.bonusesUSD) : undefined,
      deductionsSYP: Number(payrollRecord.deductionsSYP),
      deductionsUSD: payrollRecord.deductionsUSD ? Number(payrollRecord.deductionsUSD) : undefined,
      netSalarySYP: Number(payrollRecord.netSalarySYP),
      netSalaryUSD: payrollRecord.netSalaryUSD ? Number(payrollRecord.netSalaryUSD) : undefined,
    };
  }

  async updatePayrollRecord(tenantId: string, payrollId: string, data: UpdatePayrollRecordInput): Promise<PayrollRecordResponse> {
    // Check if payroll record exists and belongs to tenant
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, tenantId },
    });

    if (!existingPayroll) {
      throw new Error('Payroll record not found');
    }

    // If status is being changed to PAID, set paidAt
    let paidAt = data.paidAt;
    if (data.status === 'PAID' && !paidAt) {
      paidAt = new Date();
    }

    const payrollRecord = await prisma.payrollRecord.update({
      where: { id: payrollId },
      data: {
        basicSalarySYP: data.basicSalarySYP,
        basicSalaryUSD: data.basicSalaryUSD,
        overtimeSYP: data.overtimeSYP,
        overtimeUSD: data.overtimeUSD,
        bonusesSYP: data.bonusesSYP,
        bonusesUSD: data.bonusesUSD,
        deductionsSYP: data.deductionsSYP,
        deductionsUSD: data.deductionsUSD,
        netSalarySYP: data.netSalarySYP,
        netSalaryUSD: data.netSalaryUSD,
        status: data.status,
        paidAt,
        notes: data.notes,
      },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...payrollRecord,
      basicSalarySYP: Number(payrollRecord.basicSalarySYP),
      basicSalaryUSD: payrollRecord.basicSalaryUSD ? Number(payrollRecord.basicSalaryUSD) : undefined,
      overtimeSYP: Number(payrollRecord.overtimeSYP),
      overtimeUSD: payrollRecord.overtimeUSD ? Number(payrollRecord.overtimeUSD) : undefined,
      bonusesSYP: Number(payrollRecord.bonusesSYP),
      bonusesUSD: payrollRecord.bonusesUSD ? Number(payrollRecord.bonusesUSD) : undefined,
      deductionsSYP: Number(payrollRecord.deductionsSYP),
      deductionsUSD: payrollRecord.deductionsUSD ? Number(payrollRecord.deductionsUSD) : undefined,
      netSalarySYP: Number(payrollRecord.netSalarySYP),
      netSalaryUSD: payrollRecord.netSalaryUSD ? Number(payrollRecord.netSalaryUSD) : undefined,
    };
  }

  async deletePayrollRecord(tenantId: string, payrollId: string): Promise<void> {
    // Check if payroll record exists and belongs to tenant
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, tenantId },
    });

    if (!existingPayroll) {
      throw new Error('Payroll record not found');
    }

    // Cannot delete paid payroll records
    if (existingPayroll.status === 'PAID') {
      throw new Error('Cannot delete paid payroll record');
    }

    await prisma.payrollRecord.delete({
      where: { id: payrollId },
    });
  }

  async approvePayrollRecord(tenantId: string, payrollId: string): Promise<PayrollRecordResponse> {
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, tenantId },
    });

    if (!existingPayroll) {
      throw new Error('Payroll record not found');
    }

    if (existingPayroll.status !== 'DRAFT') {
      throw new Error('Only draft payroll records can be approved');
    }

    const payrollRecord = await prisma.payrollRecord.update({
      where: { id: payrollId },
      data: { status: 'APPROVED' },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...payrollRecord,
      basicSalarySYP: Number(payrollRecord.basicSalarySYP),
      basicSalaryUSD: payrollRecord.basicSalaryUSD ? Number(payrollRecord.basicSalaryUSD) : undefined,
      overtimeSYP: Number(payrollRecord.overtimeSYP),
      overtimeUSD: payrollRecord.overtimeUSD ? Number(payrollRecord.overtimeUSD) : undefined,
      bonusesSYP: Number(payrollRecord.bonusesSYP),
      bonusesUSD: payrollRecord.bonusesUSD ? Number(payrollRecord.bonusesUSD) : undefined,
      deductionsSYP: Number(payrollRecord.deductionsSYP),
      deductionsUSD: payrollRecord.deductionsUSD ? Number(payrollRecord.deductionsUSD) : undefined,
      netSalarySYP: Number(payrollRecord.netSalarySYP),
      netSalaryUSD: payrollRecord.netSalaryUSD ? Number(payrollRecord.netSalaryUSD) : undefined,
    };
  }

  async markAsPaid(tenantId: string, payrollId: string, userId?: string): Promise<PayrollRecordResponse> {
    const existingPayroll = await prisma.payrollRecord.findFirst({
      where: { id: payrollId, tenantId },
    });

    if (!existingPayroll) {
      throw new Error('Payroll record not found');
    }

    if (existingPayroll.status !== 'APPROVED') {
      throw new Error('Only approved payroll records can be marked as paid');
    }

    const payrollRecord = await prisma.payrollRecord.update({
      where: { id: payrollId },
      data: { status: 'PAID', paidAt: new Date() },
      select: {
        id: true,
        tenantId: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        basicSalarySYP: true,
        basicSalaryUSD: true,
        overtimeSYP: true,
        overtimeUSD: true,
        bonusesSYP: true,
        bonusesUSD: true,
        deductionsSYP: true,
        deductionsUSD: true,
        netSalarySYP: true,
        netSalaryUSD: true,
        status: true,
        paidAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create automatic journal entry for payroll payment
    try {
      await createPayrollJournalEntry(payrollRecord, tenantId, userId || null);
    } catch (error) {
      Logger.error('Failed to create payroll journal entry:', error);
      // Don't throw error - payroll is already marked as paid
    }

    return {
      ...payrollRecord,
      basicSalarySYP: Number(payrollRecord.basicSalarySYP),
      basicSalaryUSD: payrollRecord.basicSalaryUSD ? Number(payrollRecord.basicSalaryUSD) : undefined,
      overtimeSYP: Number(payrollRecord.overtimeSYP),
      overtimeUSD: payrollRecord.overtimeUSD ? Number(payrollRecord.overtimeUSD) : undefined,
      bonusesSYP: Number(payrollRecord.bonusesSYP),
      bonusesUSD: payrollRecord.bonusesUSD ? Number(payrollRecord.bonusesUSD) : undefined,
      deductionsSYP: Number(payrollRecord.deductionsSYP),
      deductionsUSD: payrollRecord.deductionsUSD ? Number(payrollRecord.deductionsUSD) : undefined,
      netSalarySYP: Number(payrollRecord.netSalarySYP),
      netSalaryUSD: payrollRecord.netSalaryUSD ? Number(payrollRecord.netSalaryUSD) : undefined,
    };
  }
}
