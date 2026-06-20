import {
  createJournalEntry,
  reverseJournalEntry,
  createPayrollJournalEntry,
} from '../../src/modules/accounting/automatic-journal-entries';

// Mock Prisma client
const mockPrisma = {
  account: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  fiscalPeriod: {
    findFirst: jest.fn(),
  },
  journalEntry: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  journalLine: {
    createMany: jest.fn(),
  },
  exchangeRate: {
    findFirst: jest.fn(),
  },
  employee: {
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('../../src/config/database', () => mockPrisma);

describe('Automatic Journal Entries Service', () => {
  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';
  const mockFiscalPeriod = {
    id: 'fiscal-period-id',
    tenantId: mockTenantId,
    name: '2024',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    isClosed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount = {
    id: 'account-id',
    tenantId: mockTenantId,
    code: '1000',
    nameAr: 'النقدية',
    nameEn: 'Cash',
    accountType: 'ASSET',
    parentId: null,
    balanceSYP: 10000,
    balanceUSD: 2000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Set up fiscal period mock at top level (no beforeEach clearing)
  beforeAll(() => {
    mockPrisma.fiscalPeriod.findFirst.mockResolvedValue(mockFiscalPeriod);
  });

  describe('createJournalEntry', () => {
    it('should create a balanced journal entry successfully', async () => {
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'journal-entry-id',
        tenantId: mockTenantId,
        entryDate: new Date(),
        description: 'Test entry',
      });
      mockPrisma.journalLine.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);
      mockPrisma.account.update.mockResolvedValue(mockAccount);

      const lines = [
        {
          accountId: 'account-1',
          debitSYP: 100,
          debitUSD: 20,
          creditSYP: 0,
          creditUSD: 0,
          description: 'Debit line',
        },
        {
          accountId: 'account-2',
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: 100,
          creditUSD: 20,
          description: 'Credit line',
        },
      ];

      const result = await createJournalEntry(
        mockTenantId,
        new Date(),
        'Test entry',
        'REF-001',
        'TEST',
        'source-id',
        mockUserId,
        lines
      );

      expect(result).toBeDefined();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalLine.createMany).toHaveBeenCalled();
    });

    it('should throw error when entry does not balance in SYP', async () => {
      const lines = [
        {
          accountId: 'account-1',
          debitSYP: 100,
          debitUSD: 20,
          creditSYP: 0,
          creditUSD: 0,
          description: 'Debit line',
        },
        {
          accountId: 'account-2',
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: 90, // Not balanced
          creditUSD: 20,
          description: 'Credit line',
        },
      ];

      await expect(
        createJournalEntry(
          mockTenantId,
          new Date(),
          'Test entry',
          null,
          null,
          null,
          null,
          lines
        )
      ).rejects.toThrow('Journal entry does not balance in SYP');
    });

    it('should throw error when entry does not balance in USD', async () => {
      const lines = [
        {
          accountId: 'account-1',
          debitSYP: 100,
          debitUSD: 20,
          creditSYP: 0,
          creditUSD: 0,
          description: 'Debit line',
        },
        {
          accountId: 'account-2',
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: 100,
          creditUSD: 18, // Not balanced
          description: 'Credit line',
        },
      ];

      await expect(
        createJournalEntry(
          mockTenantId,
          new Date(),
          'Test entry',
          null,
          null,
          null,
          null,
          lines
        )
      ).rejects.toThrow('Journal entry does not balance in USD');
    });

    it('should throw error when no open fiscal period exists', async () => {
      mockPrisma.fiscalPeriod.findFirst.mockResolvedValue(null);

      const lines = [
        {
          accountId: 'account-1',
          debitSYP: 100,
          debitUSD: 20,
          creditSYP: 0,
          creditUSD: 0,
          description: 'Debit line',
        },
        {
          accountId: 'account-2',
          debitSYP: 0,
          debitUSD: 0,
          creditSYP: 100,
          creditUSD: 20,
          description: 'Credit line',
        },
      ];

      await expect(
        createJournalEntry(
          mockTenantId,
          new Date(),
          'Test entry',
          null,
          null,
          null,
          null,
          lines
        )
      ).rejects.toThrow('No open fiscal period found for the entry date');
    });
  });

  describe('reverseJournalEntry', () => {
    it('should reverse a journal entry successfully', async () => {
      const mockOriginalEntry = {
        id: 'original-entry-id',
        tenantId: mockTenantId,
        description: 'Original entry',
        reference: 'REF-001',
        sourceType: 'INVOICE',
        isReversed: false,
        lines: [
          {
            accountId: 'account-1',
            debitSYP: 100,
            debitUSD: 20,
            creditSYP: 0,
            creditUSD: 0,
            description: 'Debit line',
          },
          {
            accountId: 'account-2',
            debitSYP: 0,
            debitUSD: 0,
            creditSYP: 100,
            creditUSD: 20,
            description: 'Credit line',
          },
        ],
      };

      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockOriginalEntry);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'reversing-entry-id',
      });
      mockPrisma.journalLine.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.account.findUnique.mockResolvedValue(mockAccount);
      mockPrisma.account.update.mockResolvedValue(mockAccount);
      mockPrisma.journalEntry.update.mockResolvedValue(mockOriginalEntry);
      mockPrisma.journalEntry.update.mockResolvedValue(mockOriginalEntry);

      const result = await reverseJournalEntry(
        'original-entry-id',
        'Correction needed',
        mockTenantId,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalEntry.update).toHaveBeenCalledWith({
        where: { id: 'original-entry-id' },
        data: {
          isReversed: true,
          reversingDate: expect.any(Date),
        },
      });
    });

    it('should throw error when original entry not found', async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);

      await expect(
        reverseJournalEntry('non-existent-id', 'Reason', mockTenantId, mockUserId)
      ).rejects.toThrow('Original journal entry not found');
    });

    it('should throw error when entry already reversed', async () => {
      const mockOriginalEntry = {
        id: 'original-entry-id',
        tenantId: mockTenantId,
        isReversed: true,
        lines: [],
      };

      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockOriginalEntry);

      await expect(
        reverseJournalEntry('original-entry-id', 'Reason', mockTenantId, mockUserId)
      ).rejects.toThrow('Journal entry already reversed');
    });

    it('should throw error when entry belongs to different tenant', async () => {
      const mockOriginalEntry = {
        id: 'original-entry-id',
        tenantId: 'different-tenant-id',
        isReversed: false,
        lines: [],
      };

      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockOriginalEntry);

      await expect(
        reverseJournalEntry('original-entry-id', 'Reason', mockTenantId, mockUserId)
      ).rejects.toThrow('Journal entry does not belong to this tenant');
    });
  });

  describe('createPayrollJournalEntry', () => {
    const mockPayrollRecord = {
      id: 'payroll-1',
      tenantId: mockTenantId,
      employeeId: 'emp-1',
      periodStart: new Date('2024-05-01'),
      periodEnd: new Date('2024-05-31'),
      basicSalarySYP: 500000,
      basicSalaryUSD: null,
      overtimeSYP: 50000,
      overtimeUSD: null,
      bonusesSYP: 10000,
      bonusesUSD: null,
      deductionsSYP: 5000,
      deductionsUSD: null,
      netSalarySYP: 555000,
      netSalaryUSD: null,
      status: 'PAID' as const,
      paidAt: new Date('2024-05-31'),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEmployee = {
      id: 'emp-1',
      tenantId: mockTenantId,
      fullNameAr: 'أحمد محمد',
      fullNameEn: 'Ahmed Mohammed',
      position: 'Mechanic',
      department: {
        id: 'dept-1',
        nameAr: 'قسم الصيانة',
        nameEn: 'Maintenance',
      },
    };

    const mockCashAccount = {
      id: 'cash-account-id',
      tenantId: mockTenantId,
      code: '1000',
      nameAr: 'النقدية',
      nameEn: 'Cash',
      accountType: 'ASSET',
      balanceSYP: 1000000,
      balanceUSD: 200000,
    };

    const mockPayrollExpenseAccount = {
      id: 'payroll-expense-account-id',
      tenantId: mockTenantId,
      code: '5700',
      nameAr: 'مصروفات الرواتب',
      nameEn: 'Payroll Expenses',
      accountType: 'EXPENSE',
      balanceSYP: 5000000,
      balanceUSD: 1000000,
    };

    beforeEach(() => {
      mockPrisma.fiscalPeriod.findFirst.mockResolvedValue(mockFiscalPeriod);
    });

    it('should create a payroll journal entry successfully', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.account.findFirst
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'journal-entry-id',
        tenantId: mockTenantId,
        entryDate: new Date(),
        description: 'Payroll Payment',
      });
      mockPrisma.journalLine.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.account.findUnique
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.account.update
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);

      const result = await createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId);

      expect(result).toBeDefined();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalLine.createMany).toHaveBeenCalled();
    });

    it('should throw error when employee not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId)
      ).rejects.toThrow('Employee not found');
    });

    it('should throw error when cash account not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      await expect(
        createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId)
      ).rejects.toThrow('Cash account not found');
    });

    it('should throw error when payroll expense account not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.account.findFirst
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(null);

      await expect(
        createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId)
      ).rejects.toThrow('Payroll expense account not found');
    });

    it('should throw error when no open fiscal period exists', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.fiscalPeriod.findFirst.mockResolvedValueOnce(null);

      await expect(
        createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId)
      ).rejects.toThrow('No open fiscal period found for the payroll date');
    });

    it('should create correct journal lines for payroll payment', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.account.findFirst
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'journal-entry-id',
        tenantId: mockTenantId,
        entryDate: new Date(),
        description: 'Payroll Payment',
      });
      mockPrisma.journalLine.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.account.findUnique
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.account.update
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);

      await createPayrollJournalEntry(mockPayrollRecord, mockTenantId, mockUserId);

      expect(mockPrisma.journalLine.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            accountId: 'payroll-expense-account-id',
            debitSYP: 555000,
            debitUSD: 0,
            creditSYP: 0,
            creditUSD: 0,
            sourceType: 'PAYROLL',
            sourceId: 'payroll-1',
          }),
          expect.objectContaining({
            accountId: 'cash-account-id',
            debitSYP: 0,
            debitUSD: 0,
            creditSYP: 555000,
            creditUSD: 0,
            sourceType: 'PAYROLL',
            sourceId: 'payroll-1',
          }),
        ]),
      });
    });

    it('should use paidAt date if available, otherwise current date', async () => {
      const payrollWithPaidAt = {
        ...mockPayrollRecord,
        paidAt: new Date('2024-05-31T10:00:00'),
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.account.findFirst
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'journal-entry-id',
        tenantId: mockTenantId,
        entryDate: new Date(),
        description: 'Payroll Payment',
      });
      mockPrisma.journalLine.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.account.findUnique
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);
      mockPrisma.account.update
        .mockResolvedValueOnce(mockCashAccount)
        .mockResolvedValueOnce(mockPayrollExpenseAccount);

      await createPayrollJournalEntry(payrollWithPaidAt, mockTenantId, mockUserId);

      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entryDate: new Date('2024-05-31T10:00:00'),
        })
      );
    });
  });
});
