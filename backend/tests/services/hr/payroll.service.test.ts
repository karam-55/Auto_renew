import { PayrollService } from '../../../src/modules/payroll/service';
import prisma from '../../../src/config/database';

// Mock Prisma
jest.mock('../../../src/config/database', () => ({
  __esModule: true,
  default: {
    payrollRecord: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock automatic journal entries
jest.mock('../../../src/modules/accounting/automatic-journal-entries', () => ({
  createPayrollJournalEntry: jest.fn(),
}));

import { createPayrollJournalEntry } from '../../../src/modules/accounting/automatic-journal-entries';

describe('PayrollService', () => {
  let payrollService: PayrollService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    payrollService = new PayrollService();
    jest.clearAllMocks();
  });

  describe('getAllPayrollRecords', () => {
    it('should return all payroll records for a tenant', async () => {
      const mockPayrollRecords = [
        {
          id: 'payroll-1',
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          periodStart: new Date('2024-05-01'),
          periodEnd: new Date('2024-05-31'),
          basicSalarySYP: 500000,
          basicSalaryUSD: null,
          overtimeSYP: 0,
          overtimeUSD: null,
          bonusesSYP: 0,
          bonusesUSD: null,
          deductionsSYP: 0,
          deductionsUSD: null,
          netSalarySYP: 500000,
          netSalaryUSD: null,
          status: 'DRAFT',
          paidAt: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.payrollRecord.findMany as jest.Mock).mockResolvedValue(mockPayrollRecords);

      const result = await payrollService.getAllPayrollRecords(mockTenantId);

      expect(prisma.payrollRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: expect.any(Object),
        orderBy: { periodStart: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getPayrollRecordById', () => {
    it('should return payroll record by ID', async () => {
      const mockPayrollRecord = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'DRAFT',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(mockPayrollRecord);

      const result = await payrollService.getPayrollRecordById(mockTenantId, 'payroll-1');

      expect(prisma.payrollRecord.findFirst).toHaveBeenCalledWith({
        where: { id: 'payroll-1', tenantId: mockTenantId },
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should return null if payroll record not found', async () => {
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await payrollService.getPayrollRecordById(mockTenantId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getPayrollRecordsByEmployee', () => {
    it('should return payroll records for a specific employee', async () => {
      const mockPayrollRecords = [
        {
          id: 'payroll-1',
          tenantId: mockTenantId,
          employeeId: 'emp-1',
          periodStart: new Date('2024-05-01'),
          periodEnd: new Date('2024-05-31'),
          basicSalarySYP: 500000,
          basicSalaryUSD: null,
          overtimeSYP: 0,
          overtimeUSD: null,
          bonusesSYP: 0,
          bonusesUSD: null,
          deductionsSYP: 0,
          deductionsUSD: null,
          netSalarySYP: 500000,
          netSalaryUSD: null,
          status: 'DRAFT',
          paidAt: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.payrollRecord.findMany as jest.Mock).mockResolvedValue(mockPayrollRecords);

      const result = await payrollService.getPayrollRecordsByEmployee(mockTenantId, 'emp-1');

      expect(prisma.payrollRecord.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, employeeId: 'emp-1' },
        select: expect.any(Object),
        orderBy: { periodStart: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getPayrollRecordsByPeriod', () => {
    it('should return payroll records for a specific period', async () => {
      const periodStart = new Date('2024-05-01');
      const periodEnd = new Date('2024-05-31');

      (prisma.payrollRecord.findMany as jest.Mock).mockResolvedValue([]);

      await payrollService.getPayrollRecordsByPeriod(mockTenantId, periodStart, periodEnd);

      expect(prisma.payrollRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        select: expect.any(Object),
        orderBy: { periodStart: 'desc' },
      });
    });
  });

  describe('createPayrollRecord', () => {
    it('should create a new payroll record', async () => {
      const payrollData = {
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: undefined,
        overtimeSYP: 0,
        overtimeUSD: undefined,
        bonusesSYP: 0,
        bonusesUSD: undefined,
        deductionsSYP: 0,
        deductionsUSD: undefined,
        netSalarySYP: 500000,
        netSalaryUSD: undefined,
        status: 'DRAFT' as const,
        notes: undefined,
      };

      const mockPayrollRecord = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        ...payrollData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.payrollRecord.create as jest.Mock).mockResolvedValue(mockPayrollRecord);

      const result = await payrollService.createPayrollRecord(mockTenantId, payrollData);

      expect(prisma.payrollRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          employeeId: payrollData.employeeId,
          periodStart: payrollData.periodStart,
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if employee not found', async () => {
      const payrollData = {
        employeeId: 'non-existent',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        netSalarySYP: 500000,
        status: 'DRAFT' as const,
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        payrollService.createPayrollRecord(mockTenantId, payrollData)
      ).rejects.toThrow('Employee not found');
    });

    it('should throw error if payroll record already exists for employee in period', async () => {
      const payrollData = {
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        netSalarySYP: 500000,
        status: 'DRAFT' as const,
      };

      (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-payroll' });

      await expect(
        payrollService.createPayrollRecord(mockTenantId, payrollData)
      ).rejects.toThrow('Payroll record already exists for this employee in this period');
    });
  });

  describe('updatePayrollRecord', () => {
    it('should update an existing payroll record', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'DRAFT',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        overtimeSYP: 50000,
        bonusesSYP: 10000,
        netSalarySYP: 560000,
      };

      const updatedPayroll = {
        ...existingPayroll,
        ...updateData,
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.update as jest.Mock).mockResolvedValue(updatedPayroll);

      const result = await payrollService.updatePayrollRecord(mockTenantId, 'payroll-1', updateData);

      expect(prisma.payrollRecord.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if payroll record not found', async () => {
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        payrollService.updatePayrollRecord(mockTenantId, 'non-existent', { netSalarySYP: 600000 })
      ).rejects.toThrow('Payroll record not found');
    });

    it('should set paidAt when status is changed to PAID', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'APPROVED',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        status: 'PAID' as const,
      };

      const updatedPayroll = {
        ...existingPayroll,
        ...updateData,
        paidAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.update as jest.Mock).mockResolvedValue(updatedPayroll);

      const result = await payrollService.updatePayrollRecord(mockTenantId, 'payroll-1', updateData);

      expect(prisma.payrollRecord.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: expect.objectContaining({
          status: 'PAID',
          paidAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });
  });

  describe('deletePayrollRecord', () => {
    it('should delete a payroll record', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'DRAFT',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.delete as jest.Mock).mockResolvedValue(existingPayroll);

      await payrollService.deletePayrollRecord(mockTenantId, 'payroll-1');

      expect(prisma.payrollRecord.delete).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
      });
    });

    it('should throw error if payroll record not found', async () => {
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        payrollService.deletePayrollRecord(mockTenantId, 'non-existent')
      ).rejects.toThrow('Payroll record not found');
    });

    it('should throw error if payroll record is already paid', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'PAID',
        paidAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);

      await expect(
        payrollService.deletePayrollRecord(mockTenantId, 'payroll-1')
      ).rejects.toThrow('Cannot delete paid payroll record');
    });
  });

  describe('approvePayrollRecord', () => {
    it('should approve a draft payroll record', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'DRAFT',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const approvedPayroll = {
        ...existingPayroll,
        status: 'APPROVED',
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.update as jest.Mock).mockResolvedValue(approvedPayroll);

      const result = await payrollService.approvePayrollRecord(mockTenantId, 'payroll-1');

      expect(prisma.payrollRecord.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: { status: 'APPROVED' },
        select: expect.any(Object),
      });
      expect(result).not.toBeNull();
    });

    it('should throw error if payroll record not found', async () => {
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        payrollService.approvePayrollRecord(mockTenantId, 'non-existent')
      ).rejects.toThrow('Payroll record not found');
    });

    it('should throw error if payroll record is not in DRAFT status', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'APPROVED',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);

      await expect(
        payrollService.approvePayrollRecord(mockTenantId, 'payroll-1')
      ).rejects.toThrow('Only draft payroll records can be approved');
    });
  });

  describe('markAsPaid', () => {
    it('should mark an approved payroll record as paid', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'APPROVED',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paidPayroll = {
        ...existingPayroll,
        status: 'PAID',
        paidAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.update as jest.Mock).mockResolvedValue(paidPayroll);
      (createPayrollJournalEntry as jest.Mock).mockResolvedValue({ id: 'journal-1' });

      const result = await payrollService.markAsPaid(mockTenantId, 'payroll-1', 'user-1');

      expect(prisma.payrollRecord.update).toHaveBeenCalledWith({
        where: { id: 'payroll-1' },
        data: { status: 'PAID', paidAt: expect.any(Date) },
        select: expect.any(Object),
      });
      expect(createPayrollJournalEntry).toHaveBeenCalledWith(
        paidPayroll,
        mockTenantId,
        'user-1'
      );
      expect(result).not.toBeNull();
    });

    it('should throw error if payroll record not found', async () => {
      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        payrollService.markAsPaid(mockTenantId, 'non-existent')
      ).rejects.toThrow('Payroll record not found');
    });

    it('should throw error if payroll record is not approved', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'DRAFT',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);

      await expect(
        payrollService.markAsPaid(mockTenantId, 'payroll-1')
      ).rejects.toThrow('Only approved payroll records can be marked as paid');
    });

    it('should not throw error if journal entry creation fails', async () => {
      const existingPayroll = {
        id: 'payroll-1',
        tenantId: mockTenantId,
        employeeId: 'emp-1',
        periodStart: new Date('2024-05-01'),
        periodEnd: new Date('2024-05-31'),
        basicSalarySYP: 500000,
        basicSalaryUSD: null,
        overtimeSYP: 0,
        overtimeUSD: null,
        bonusesSYP: 0,
        bonusesUSD: null,
        deductionsSYP: 0,
        deductionsUSD: null,
        netSalarySYP: 500000,
        netSalaryUSD: null,
        status: 'APPROVED',
        paidAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const paidPayroll = {
        ...existingPayroll,
        status: 'PAID',
        paidAt: new Date(),
      };

      (prisma.payrollRecord.findFirst as jest.Mock).mockResolvedValue(existingPayroll);
      (prisma.payrollRecord.update as jest.Mock).mockResolvedValue(paidPayroll);
      (createPayrollJournalEntry as jest.Mock).mockRejectedValue(new Error('Journal entry failed'));

      const result = await payrollService.markAsPaid(mockTenantId, 'payroll-1');

      expect(result).not.toBeNull();
    });
  });
});
