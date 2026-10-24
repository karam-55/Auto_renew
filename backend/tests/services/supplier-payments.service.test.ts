export {};

const tx: any = {
  supplierPayment: { findFirst: jest.fn(), create: jest.fn() },
  supplier: { update: jest.fn() },
};
const prismaMock: any = {
  supplier: { findFirst: jest.fn() },
  journalLine: { findMany: jest.fn() },
  inventoryTransaction: { findMany: jest.fn() },
  expense: { findMany: jest.fn() },
  supplierPayment: { findMany: jest.fn() },
  $transaction: jest.fn((callback: any) => callback(tx)),
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));
jest.doMock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getRequiredExchangeRate: jest.fn().mockResolvedValue(1000) },
}));
jest.doMock('../../src/modules/accounting/automatic-journal-entries', () => ({
  ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
  getAccountIdByRole: jest.fn(async (_tenantId: string, role: string) =>
    role === 'ACCOUNTS_PAYABLE' ? 'ap-account' : role === 'CASH' ? 'cash-account' : null
  ),
  createJournalEntry: jest.fn().mockResolvedValue({ id: 'journal-1' }),
}));

const { SupplierPaymentService } = require('../../src/modules/supplier-payments/service');
const { createJournalEntry } = require('../../src/modules/accounting/automatic-journal-entries');

describe('SupplierPaymentService', () => {
  const service = new SupplierPaymentService();

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.supplier.findFirst.mockResolvedValue({ id: 'supplier-1', tenantId: 'tenant-1', name: 'Supplier' });
    tx.supplierPayment.findFirst.mockResolvedValue(null);
    tx.supplierPayment.create.mockResolvedValue({
      id: 'payment-1',
      supplierId: 'supplier-1',
      amountSYP: 10000,
      amountUSD: 10,
      paymentDate: new Date('2026-10-15'),
      reference: 'SP-1',
    });
    prismaMock.inventoryTransaction.findMany.mockResolvedValue([]);
    prismaMock.expense.findMany.mockResolvedValue([]);
    prismaMock.supplierPayment.findMany.mockResolvedValue([]);
    tx.supplier.update.mockResolvedValue({});
  });

  it('records the payment, decreases the cached payable, and posts a balanced AP-to-cash journal', async () => {
    const payment = await service.createPayment('tenant-1', 'user-1', {
      supplierId: 'supplier-1',
      amount: 10,
      currency: 'USD',
      paymentMethod: 'CASH',
      paymentDate: '2026-10-15',
      reference: 'SP-1',
      idempotencyKey: 'request-1',
    });

    expect(payment.id).toBe('payment-1');
    expect(tx.supplierPayment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amountSYP: 10000, amountUSD: 10, originalCurrency: 'USD' }),
    }));
    expect(createJournalEntry).toHaveBeenCalledWith(
      'tenant-1',
      expect.any(Date),
      expect.stringContaining('Supplier payment'),
      'SP-1',
      'SUPPLIER_PAYMENT',
      'payment-1',
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({ accountId: 'ap-account', debitSYP: 10000, supplierId: 'supplier-1' }),
        expect.objectContaining({ accountId: 'cash-account', creditSYP: 10000, supplierId: 'supplier-1' }),
      ]),
      tx,
      1000,
    );
    expect(tx.supplier.update).toHaveBeenCalledWith({
      where: { id: 'supplier-1' },
      data: { balance: { decrement: 10000 } },
    });
  });

  it('returns an existing request without posting or reducing balance again', async () => {
    tx.supplierPayment.findFirst.mockResolvedValueOnce({
      id: 'existing-payment',
      supplierId: 'supplier-1',
      originalAmount: 10,
      originalCurrency: 'USD',
      paymentMethod: 'CASH',
    });
    const result = await service.createPayment('tenant-1', 'user-1', {
      supplierId: 'supplier-1',
      amount: 10,
      currency: 'USD',
      paymentMethod: 'CASH',
      idempotencyKey: 'request-1',
    });

    expect(result.id).toBe('existing-payment');
    expect(createJournalEntry).not.toHaveBeenCalled();
    expect(tx.supplier.update).not.toHaveBeenCalled();
  });

  it('computes supplier balances from posted liability journal lines', async () => {
    prismaMock.supplier.findFirst.mockResolvedValueOnce({ id: 'supplier-1', name: 'Supplier', balance: 700 });
    prismaMock.journalLine.findMany.mockResolvedValue([
      {
        entryId: 'grn-entry',
        debitSYP: 0,
        creditSYP: 1000,
        debitUSD: 0,
        creditUSD: 1,
        description: 'GRN payable',
        entry: { entryDate: new Date('2026-10-01'), reference: 'GRN-1', description: 'GRN', sourceType: 'GRN' },
        account: { code: '2110', nameAr: 'ذمم الموردين' },
      },
      {
        entryId: 'payment-entry',
        debitSYP: 300,
        creditSYP: 0,
        debitUSD: 0.3,
        creditUSD: 0,
        description: 'Payment',
        entry: { entryDate: new Date('2026-10-05'), reference: 'SP-1', description: 'Supplier payment', sourceType: 'SUPPLIER_PAYMENT' },
        account: { code: '2110', nameAr: 'ذمم الموردين' },
      },
    ]);

    const statement = await service.getSupplierStatement('tenant-1', 'supplier-1');

    expect(statement.closingBalanceSYP).toBe(700);
    expect(statement.closingBalanceUSD).toBeCloseTo(0.7);
    expect(statement.transactions).toHaveLength(2);
    expect(statement.activity).toEqual([]);
  });

  it('combines received materials and payments in the supplier activity ledger', async () => {
    const receivedAt = new Date('2026-10-12T09:00:00Z');
    const paidAt = new Date('2026-10-13T09:00:00Z');
    prismaMock.inventoryTransaction.findMany.mockResolvedValue([{
      id: 'stock-in-1',
      type: 'STOCK_IN',
      createdAt: receivedAt,
      quantity: 10,
      costSYP: 25,
      costUSD: 0.25,
      reference: 'GRN:GRN-2026-00001',
      notes: 'توريد زيت',
      part: { name: 'Oil', nameAr: 'زيت محرك', baseUnitName: 'لتر' },
      warehouse: { name: 'المستودع الرئيسي' },
    }]);
    prismaMock.supplierPayment.findMany.mockResolvedValue([{
      id: 'supplier-payment-1',
      paymentDate: paidAt,
      paymentMethod: 'BANK',
      amountSYP: 100,
      amountUSD: 1,
      reference: 'SP-1',
      notes: null,
    }]);

    const statement = await service.getSupplierStatement('tenant-1', 'supplier-1');

    expect(statement.activity).toHaveLength(2);
    expect(statement.activity[0]).toMatchObject({
      id: 'supplier-payment-1',
      kind: 'PAYMENT',
      description: 'دفعة للمورد (من البنك)',
      amountSYP: 100,
    });
    expect(statement.activity[1]).toMatchObject({
      id: 'stock-in-1',
      kind: 'PURCHASE',
      description: 'استلام مادة: زيت محرك',
      quantity: 10,
      unitName: 'لتر',
      amountSYP: 250,
    });
  });
});
