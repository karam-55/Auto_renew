import { InvoiceStatus } from '@prisma/client';
import { InvoiceService } from '../../src/modules/invoices/service';
import prisma from '../../src/config/database';

jest.mock('../../src/config/database', () => {
  const client: any = {
    invoice: { count: jest.fn(), create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    invoiceNumberSequence: { upsert: jest.fn() },
    invoiceItem: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() },
    customer: { findFirst: jest.fn() },
    vehicle: { findFirst: jest.fn() },
    booking: { findFirst: jest.fn() },
    bookingService: { findMany: jest.fn() },
    taxRate: { findFirst: jest.fn() },
    part: { findFirst: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    inventoryTransaction: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    journalEntry: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    payment: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
  };
  client.$transaction = jest.fn(async (operation: any) =>
    typeof operation === 'function' ? operation(client) : Promise.all(operation)
  );
  return { __esModule: true, default: client };
});
jest.mock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn().mockResolvedValue({ exchangeRate: 139, taxRate: 10, invoicePrefix: 'INV' }),
    getRequiredExchangeRate: jest.fn().mockResolvedValue(139),
  },
}));
jest.mock('../../src/modules/accounting/automatic-journal-entries', () => ({
  createInvoiceJournalEntry: jest.fn().mockResolvedValue({ id: 'invoice-journal' }),
  createStockConsumptionJournalEntry: jest.fn().mockResolvedValue({ id: 'cogs-journal' }),
  ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
  reverseJournalEntry: jest.fn().mockResolvedValue({ id: 'reversal-journal' }),
}));
jest.mock('../../src/modules/loyalty/service', () => ({
  LoyaltyService: jest.fn().mockImplementation(() => ({
    setIo: jest.fn(),
    calculatePointsFromInvoice: jest.fn().mockResolvedValue(0),
    addPoints: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../../src/modules/whatsapp/service', () => ({
  WhatsAppService: jest.fn().mockImplementation(() => ({
    setIo: jest.fn(),
    sendInvoiceNotification: jest.fn().mockResolvedValue(undefined),
    sendLoyaltyPointsEarned: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../../src/modules/notifications/telegram-admin-notification.service', () => ({
  TelegramAdminNotificationService: jest.fn().mockImplementation(() => ({
    notifyInvoiceCreated: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('InvoiceService accounting and stock lifecycle', () => {
  let service: InvoiceService;
  const tenantId = 'tenant-1';

  beforeEach(() => {
    service = new InvoiceService();
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((operation: any) => operation(prisma));
    (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'customer-1', tenantId });
    (prisma.invoice.count as jest.Mock).mockResolvedValue(0);
    (prisma.invoiceNumberSequence.upsert as jest.Mock).mockResolvedValue({ lastValue: 1 });
    (prisma.invoice.create as jest.Mock).mockImplementation(({ data }: any) => Promise.resolve({ id: 'invoice-1', ...data }));
    (prisma.invoiceItem.create as jest.Mock).mockImplementation(({ data }: any) => Promise.resolve({ id: 'item-1', ...data }));
    (prisma.invoice.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountSYP: 0, amountUSD: 0 } });
    (prisma.part.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({ id: 'movement-1' });
  });

  it('creates a draft without stock movement or journal effects and derives SYP/tax from USD', async () => {
    const invoice = await service.createInvoice(tenantId, 'user-1', {
      customerId: 'customer-1',
      invoiceDate: new Date('2026-10-08'),
      items: [{ partId: 'part-1', description: 'Part', quantity: 2, priceSYP: 999, priceUSD: 10 }],
      discountType: 'FIXED',
      discountUSD: 1,
    } as any);

    expect(invoice.status).toBe(InvoiceStatus.DRAFT);
    expect(prisma.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        invoiceNumber: 'INV-2026-00001',
        subtotalSYP: 2780,
        subtotalUSD: 20,
        taxSYP: 278,
        taxUSD: 2,
        discountSYP: 139,
        discountUSD: 1,
        totalSYP: 2919,
        totalUSD: 21,
      }),
    }));
    expect(prisma.inventoryTransaction.create).not.toHaveBeenCalled();
    expect(prisma.part.updateMany).not.toHaveBeenCalled();
    expect(require('../../src/modules/accounting/automatic-journal-entries').createInvoiceJournalEntry).not.toHaveBeenCalled();
  });

  it('consumes the AVCO cost once at finalization and posts both journals in the same transaction', async () => {
    const invoice = {
      id: 'invoice-1', tenantId, invoiceNumber: 'INV-2026-00001', status: InvoiceStatus.DRAFT,
      invoiceDate: new Date('2026-10-08'), customerId: null, customer: null, paidSYP: 0, paidUSD: 0,
      items: [{ id: 'item-1', partId: 'part-1', serviceId: null, quantity: 2, priceSYP: 1390, priceUSD: 10,
        description: 'Part', totalSYP: 2780, totalUSD: 20 }],
    };
    const part = { id: 'part-1', tenantId, name: 'Part', quantity: 5, costSYP: 695, costUSD: 5 };
    const movement = { id: 'movement-1', tenantId, partId: part.id, type: 'CONSUMPTION', quantity: 2,
      costSYP: 695, costUSD: 5, createdAt: new Date('2026-10-08'), part: { name: 'Part' } };
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValueOnce(invoice).mockResolvedValueOnce({ ...invoice, status: InvoiceStatus.ISSUED });
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ ...invoice, status: InvoiceStatus.ISSUED });
    (prisma.part.findFirst as jest.Mock).mockResolvedValue(part);
    (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(movement);

    const result = await service.finalizeInvoice(tenantId, invoice.id, 'user-1');

    expect(prisma.part.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: part.id, tenantId, quantity: { gte: 2 } },
      data: { quantity: { decrement: 2 } },
    }));
    expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ invoiceId: invoice.id, costSYP: 695, costUSD: 5, createdBy: 'user-1' }),
    }));
    const accounting = require('../../src/modules/accounting/automatic-journal-entries');
    expect(accounting.createStockConsumptionJournalEntry).toHaveBeenCalledWith(movement, tenantId, 'user-1', prisma);
    expect(accounting.createInvoiceJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: invoice.id, items: invoice.items }), tenantId, 'user-1', prisma
    );
    expect(result.status).toBe(InvoiceStatus.ISSUED);
    await expect(service.finalizeInvoice(tenantId, invoice.id, 'user-1')).rejects.toThrow('Can only finalize invoices in DRAFT status');
    expect(prisma.inventoryTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('reverses the invoice and each linked consumption exactly once on cancellation', async () => {
    const invoice = {
      id: 'invoice-1', tenantId, invoiceNumber: 'INV-2026-00001', status: InvoiceStatus.ISSUED,
      paidSYP: 0, paidUSD: 0, totalSYP: 100, totalUSD: 1,
    };
    const movement = { id: 'movement-1', tenantId, invoiceId: invoice.id, partId: 'part-1', type: 'CONSUMPTION', quantity: 2,
      costSYP: 50, costUSD: 0.5, reference: invoice.invoiceNumber };
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValueOnce(invoice).mockResolvedValueOnce({ ...invoice, status: InvoiceStatus.CANCELLED });
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({ ...invoice, status: InvoiceStatus.CANCELLED });
    (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue([movement]);
    (prisma.inventoryTransaction.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.journalEntry.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 'invoice-journal' })
      .mockResolvedValueOnce({ id: 'cogs-journal' });

    const result = await service.cancelInvoice(tenantId, invoice.id, 'user-1');

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: invoice.id, tenantId, status: { in: [InvoiceStatus.SENT, InvoiceStatus.ISSUED] } },
      data: { status: InvoiceStatus.CANCELLED },
    }));
    expect(prisma.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'RETURN', reference: `CANCEL:${movement.id}`, invoiceId: invoice.id }),
    }));
    expect(prisma.part.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: movement.partId }, data: { quantity: { increment: movement.quantity } },
    }));
    expect(require('../../src/modules/accounting/automatic-journal-entries').reverseJournalEntry).toHaveBeenCalledTimes(2);
    expect(result.status).toBe(InvoiceStatus.CANCELLED);
    await expect(service.cancelInvoice(tenantId, invoice.id, 'user-1')).rejects.toThrow('CANNOT_CANCEL_INVOICE');
    expect(prisma.inventoryTransaction.create).toHaveBeenCalledTimes(1);
  });

  describe('syncInvoiceFromBooking', () => {
    it('rebuilds draft items from booking services and recalculates totals', async () => {
      const invoice = {
        id: 'invoice-1', tenantId, invoiceNumber: 'INV-2026-00001', status: InvoiceStatus.DRAFT,
        bookingId: 'booking-1', taxRateId: null, discountType: 'FIXED',
        discountSYP: 0, discountUSD: 0, discountPercent: 0, items: [],
      };
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(invoice);
      (prisma.bookingService.findMany as jest.Mock).mockResolvedValue([
        { serviceId: 'svc-1', priceSYP: 1000, priceUSD: 10, service: { name: 'تغيير زيت' } },
        { serviceId: 'svc-2', priceSYP: 2000, priceUSD: null, service: { name: 'فحص' } },
      ]);
      (prisma.invoice.update as jest.Mock).mockImplementation(({ data }: any) => Promise.resolve({ ...invoice, ...data }));

      const result = await service.syncInvoiceFromBooking(tenantId, invoice.id);

      // taxRate from settings = 10% → tax = 3000 * 0.10 = 300
      expect(prisma.invoiceItem.deleteMany).toHaveBeenCalledWith({ where: { invoiceId: invoice.id } });
      expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ subtotalSYP: 3000, taxSYP: 300, totalSYP: 3300 }),
      }));
      expect(prisma.invoiceItem.create).toHaveBeenCalledTimes(2);
      expect(result.totalSYP).toBe(3300);
    });

    it('rejects non-draft invoices and invoices without a booking', async () => {
      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'i-issued', tenantId, status: InvoiceStatus.ISSUED, bookingId: 'b-1', items: [],
      });
      await expect(service.syncInvoiceFromBooking(tenantId, 'i-issued'))
        .rejects.toThrow('Only draft invoices can be synced from the booking');

      (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'i-nobk', tenantId, status: InvoiceStatus.DRAFT, bookingId: null, items: [],
      });
      await expect(service.syncInvoiceFromBooking(tenantId, 'i-nobk'))
        .rejects.toThrow('Invoice is not linked to a booking');
    });
  });
});
