import { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { PaymentService } from '../../src/modules/payments/service';
import prisma from '../../src/config/database';

jest.mock('../../src/config/database', () => {
  const client: any = {
    invoice: { findFirst: jest.fn(), update: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
    journalEntry: { findMany: jest.fn() },
  };
  client.$transaction = jest.fn(async (operation: any) =>
    typeof operation === 'function' ? operation(client) : Promise.all(operation)
  );
  return { __esModule: true, default: client };
});
jest.mock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getRequiredExchangeRate: jest.fn().mockResolvedValue(139) },
}));
jest.mock('../../src/modules/accounting/automatic-journal-entries', () => ({
  createPaymentReceivedJournalEntry: jest.fn().mockResolvedValue({ id: 'payment-journal' }),
  ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
  reverseJournalEntry: jest.fn().mockResolvedValue({ id: 'reversal-journal' }),
}));
jest.mock('../../src/modules/notifications/telegram-admin-notification.service', () => ({
  TelegramAdminNotificationService: jest.fn().mockImplementation(() => ({
    notifyPaymentReceived: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../../src/modules/whatsapp/service', () => ({
  WhatsAppService: jest.fn().mockImplementation(() => ({
    sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('PaymentService accounting lifecycle', () => {
  let service: PaymentService;
  const tenantId = 'tenant-1';
  const invoice = {
    id: 'invoice-1', tenantId, status: InvoiceStatus.ISSUED,
    totalSYP: 2780, totalUSD: 20, paidSYP: 0, paidUSD: 0,
  };

  beforeEach(() => {
    service = new PaymentService();
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((operation: any) => operation(prisma));
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountSYP: 0, amountUSD: 0 } });
  });

  it('creates a USD-only payment atomically and updates both invoice balances', async () => {
    const created = {
      id: 'payment-1', tenantId, invoiceId: invoice.id, amountSYP: 1390, amountUSD: 10,
      paymentDate: new Date('2026-10-08'), paymentMethod: PaymentMethod.CASH,
      createdAt: new Date(), reference: 'R-1',
    };
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(invoice);
    (prisma.payment.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { amountSYP: 0, amountUSD: 0 } })
      .mockResolvedValueOnce({ _sum: { amountSYP: 1390, amountUSD: 10 } });
    (prisma.payment.create as jest.Mock).mockResolvedValue(created);
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ ...created, invoice });

    const result = await service.createPayment(tenantId, 'user-1', {
      invoiceId: invoice.id,
      amountUSD: 10,
      paymentDate: new Date('2026-10-08'),
      paymentMethod: PaymentMethod.CASH,
    });

    expect(prisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amountSYP: 1390, amountUSD: 10 }),
    }));
    expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: invoice.id },
      data: expect.objectContaining({ paidSYP: 1390, paidUSD: 10, status: InvoiceStatus.PARTIALLY_PAID }),
    }));
    expect(require('../../src/modules/accounting/automatic-journal-entries').createPaymentReceivedJournalEntry)
      .toHaveBeenCalledWith(expect.objectContaining({ id: created.id }), tenantId, 'user-1', prisma);
    expect(result.amountSYP).toBe(1390);
    expect(result.amountUSD).toBe(10);
  });

  it('rejects overpayment before writing payment or journal rows', async () => {
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue({ ...invoice, paidSYP: 2500, paidUSD: 18 });
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountSYP: 2500, amountUSD: 18 } });

    await expect(service.createPayment(tenantId, 'user-1', {
      invoiceId: invoice.id,
      amountUSD: 3,
      paymentMethod: PaymentMethod.CASH,
    })).rejects.toThrow('Payment exceeds the remaining invoice balance');
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(require('../../src/modules/accounting/automatic-journal-entries').createPaymentReceivedJournalEntry).not.toHaveBeenCalled();
  });

  it('does not report success if payment journal creation fails', async () => {
    const created = {
      id: 'payment-1', tenantId, invoiceId: invoice.id, amountSYP: 1390, amountUSD: 10,
      paymentDate: new Date(), paymentMethod: PaymentMethod.CASH, createdAt: new Date(),
    };
    (prisma.invoice.findFirst as jest.Mock).mockResolvedValue(invoice);
    (prisma.payment.create as jest.Mock).mockResolvedValue(created);
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ ...created, invoice });
    require('../../src/modules/accounting/automatic-journal-entries').createPaymentReceivedJournalEntry
      .mockRejectedValueOnce(new Error('journal failed'));

    await expect(service.createPayment(tenantId, 'user-1', {
      invoiceId: invoice.id, amountUSD: 10, paymentMethod: PaymentMethod.CASH,
    })).rejects.toThrow('journal failed');
  });

  it('reverses and replaces an edited payment while recalculating invoice totals', async () => {
    const existing = {
      id: 'payment-1', tenantId, invoiceId: invoice.id, amountSYP: 1390, amountUSD: 10,
      paymentDate: new Date('2026-10-01'), paymentMethod: PaymentMethod.CASH,
      invoice: { ...invoice, paidSYP: 1390, paidUSD: 10 },
    };
    const updated = { ...existing, amountSYP: 695, amountUSD: 5, paymentMethod: PaymentMethod.BANK_TRANSFER };
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.journalEntry.findMany as jest.Mock).mockResolvedValue([{ id: 'old-journal' }]);
    (prisma.payment.update as jest.Mock).mockResolvedValue(updated);
    (prisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountSYP: 695, amountUSD: 5 } });
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({ ...updated, invoice: { ...invoice, paidSYP: 695, paidUSD: 5 } });

    const result = await service.updatePayment(tenantId, existing.id, {
      amountUSD: 5,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    }, 'user-1');

    expect(require('../../src/modules/accounting/automatic-journal-entries').reverseJournalEntry)
      .toHaveBeenCalledWith('old-journal', 'Payment corrected', tenantId, 'user-1', prisma);
    expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: invoice.id },
      data: expect.objectContaining({ paidSYP: 695, paidUSD: 5, status: InvoiceStatus.PARTIALLY_PAID }),
    }));
    expect(require('../../src/modules/accounting/automatic-journal-entries').createPaymentReceivedJournalEntry)
      .toHaveBeenCalledWith(expect.objectContaining({ id: existing.id }), tenantId, 'user-1', prisma, 'PAYMENT_UPDATE', expect.stringMatching(/^payment-1:/));
    expect(result.amountUSD).toBe(5);
  });

  it('reverses ledger history and soft-deletes a payment instead of deleting it', async () => {
    const existing = {
      id: 'payment-1', tenantId, invoiceId: invoice.id, amountSYP: 1390, amountUSD: 10,
      paymentDate: new Date(), paymentMethod: PaymentMethod.CASH,
      invoice: { ...invoice, paidSYP: 1390, paidUSD: 10 },
    };
    (prisma.payment.findFirst as jest.Mock).mockResolvedValue(existing);
    (prisma.journalEntry.findMany as jest.Mock).mockResolvedValue([{ id: 'active-journal' }]);

    await service.deletePayment(tenantId, existing.id, 'user-1');

    expect(require('../../src/modules/accounting/automatic-journal-entries').reverseJournalEntry)
      .toHaveBeenCalledWith('active-journal', 'Payment deleted', tenantId, 'user-1', prisma);
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paidSYP: 0, paidUSD: 0, status: InvoiceStatus.ISSUED }),
    }));
  });
});
