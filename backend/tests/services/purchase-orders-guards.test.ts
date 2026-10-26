export {};

const mockPrisma: any = {
  purchaseOrder: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  goodsReceiptNote: { count: jest.fn() },
  $transaction: jest.fn(),
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: mockPrisma }));
jest.doMock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getRequiredExchangeRate: jest.fn().mockResolvedValue(140) },
}));
jest.doMock('../../src/modules/accounting/automatic-journal-entries', () => ({
  createStockIntakeJournalEntry: jest.fn(),
  createStockRevaluationJournalEntry: jest.fn(),
  ensureDefaultAccounts: jest.fn(),
}));

const { PurchaseOrderService } = require('../../src/modules/purchase-orders/service');

const tenantId = 'tenant-1';

const order = (status: string) => ({
  id: 'po-1',
  tenantId,
  supplierId: 'supplier-1',
  orderNumber: 'PO-2026-00001',
  status,
  items: [{ id: 'line-1', partId: 'part-1', quantity: 2, receivedQty: 0, costSYP: 1000, costUSD: 7 }],
});

describe('purchase order guards', () => {
  const service = new PurchaseOrderService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((operation: any) => operation(mockPrisma));
    mockPrisma.goodsReceiptNote.count.mockResolvedValue(0);
  });

  it('rejects direct status changes through the generic update', async () => {
    mockPrisma.purchaseOrder.findFirst.mockResolvedValue(order('PENDING'));

    await expect(service.updatePurchaseOrder('po-1', tenantId, { status: 'RECEIVED' }))
      .rejects.toThrow('Status changes go through approve, receive, or cancel actions');
    expect(mockPrisma.purchaseOrder.update).not.toHaveBeenCalled();
  });

  it('allows editing only while the order is pending approval', async () => {
    mockPrisma.purchaseOrder.findFirst.mockResolvedValue(order('APPROVED'));

    await expect(service.updatePurchaseOrder('po-1', tenantId, { notes: 'late change' }))
      .rejects.toThrow('Only pending purchase orders can be edited');
  });

  it('refuses to cancel an order that already has goods receipts', async () => {
    mockPrisma.purchaseOrder.findFirst.mockResolvedValue(order('PENDING'));
    mockPrisma.goodsReceiptNote.count.mockResolvedValue(1);

    await expect(service.cancelPurchaseOrder('po-1', tenantId))
      .rejects.toThrow('already has goods receipt notes');
    expect(mockPrisma.purchaseOrder.update).not.toHaveBeenCalled();
  });

  it('refuses to receive directly when goods receipts already exist, so stock is never counted twice', async () => {
    mockPrisma.purchaseOrder.findFirst.mockResolvedValue(order('APPROVED'));
    mockPrisma.goodsReceiptNote.count.mockResolvedValue(1);

    await expect(service.receivePurchaseOrder('po-1', tenantId, 'user-1'))
      .rejects.toThrow('already has goods receipt notes');
    expect(mockPrisma.purchaseOrder.updateMany).not.toHaveBeenCalled();
  });
});
