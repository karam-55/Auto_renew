import { DealerService } from '../../src/modules/dealers/service';
import prisma from '../../src/config/database';
import { createDealerWarrantyReceiptJournalEntry, reverseJournalEntry } from '../../src/modules/accounting/automatic-journal-entries';

jest.mock('../../src/config/database', () => {
  const client: any = {
    dealer: { findFirst: jest.fn() },
    dealerWarranty: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    dealerWarrantyReceipt: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
    journalEntry: { findFirst: jest.fn() },
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
  createDealerWarrantyReceiptJournalEntry: jest.fn().mockResolvedValue({ id: 'receipt-journal' }),
  ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
  reverseJournalEntry: jest.fn().mockResolvedValue({ id: 'reversal-journal' }),
}));
jest.mock('../../src/modules/dealers/pdf-generator', () => ({
  generateWarrantyPdf: jest.fn().mockResolvedValue({ pdfUrl: '/pdfs/w.pdf' }),
}));
jest.mock('../../src/modules/whatsapp/whatchimp.service', () => ({
  WhatChimpService: jest.fn().mockImplementation(() => ({
    sendWarrantyNotification: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

const baseWarrantyData = {
  customerName: 'عميل', customerPhone: '0999000000', manufacturer: 'BYD',
  vehicleModel: 'Song L', vehicleYear: 2025, chassisNumber: 'CH1',
  plateNumber: '550/1', mileage: 0, color: 'أبيض',
  durationMonths: 36, amountPaid: 600, currency: 'USD',
};

describe('DealerService warranty settlement', () => {
  let service: DealerService;
  const tenantId = 'tenant-1';
  const dealer = { id: 'dealer-1', tenantId, name: 'وكيل', deletedAt: null };

  beforeEach(() => {
    service = new DealerService();
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation((operation: any) => operation(prisma));
  });

  it('adminCreateWarranty derives $300 company share for HYBRID and stores the dealer remainder', async () => {
    (prisma.dealer.findFirst as jest.Mock).mockResolvedValue(dealer);
    (prisma.dealerWarranty.create as jest.Mock).mockResolvedValue({ id: 'w-1' });
    (prisma.dealerWarranty.findUnique as jest.Mock).mockResolvedValue({ id: 'w-1' });

    await service.adminCreateWarranty(dealer.id, tenantId, { ...baseWarrantyData, engineType: 'HYBRID' } as any);

    const data = (prisma.dealerWarranty.create as jest.Mock).mock.calls[0][0].data;
    expect(data.customerPaidUSD).toBe(600);
    expect(data.companyShareUSD).toBe(300);
    expect(data.dealerShareUSD).toBe(300);
  });

  it('adminCreateWarranty derives $600 company share for GASOLINE', async () => {
    (prisma.dealer.findFirst as jest.Mock).mockResolvedValue(dealer);
    (prisma.dealerWarranty.create as jest.Mock).mockResolvedValue({ id: 'w-2' });
    (prisma.dealerWarranty.findUnique as jest.Mock).mockResolvedValue({ id: 'w-2' });

    await service.adminCreateWarranty(dealer.id, tenantId, { ...baseWarrantyData, amountPaid: 1400, engineType: 'GASOLINE' } as any);

    const data = (prisma.dealerWarranty.create as jest.Mock).mock.calls[0][0].data;
    expect(data.companyShareUSD).toBe(600);
    expect(data.dealerShareUSD).toBe(800);
  });

  it('honors a custom companyShareUSD override for exceptions', async () => {
    (prisma.dealer.findFirst as jest.Mock).mockResolvedValue(dealer);
    (prisma.dealerWarranty.create as jest.Mock).mockResolvedValue({ id: 'w-3' });
    (prisma.dealerWarranty.findUnique as jest.Mock).mockResolvedValue({ id: 'w-3' });

    await service.adminCreateWarranty(dealer.id, tenantId, {
      ...baseWarrantyData, amountPaid: 500, engineType: 'GASOLINE', companyShareUSD: 300,
    } as any);

    const data = (prisma.dealerWarranty.create as jest.Mock).mock.calls[0][0].data;
    expect(data.companyShareUSD).toBe(300);
    expect(data.dealerShareUSD).toBe(200);
  });

  it('converts SYP warranty price to USD shares at the configured rate', async () => {
    (prisma.dealer.findFirst as jest.Mock).mockResolvedValue(dealer);
    (prisma.dealerWarranty.create as jest.Mock).mockResolvedValue({ id: 'w-4' });
    (prisma.dealerWarranty.findUnique as jest.Mock).mockResolvedValue({ id: 'w-4' });

    await service.adminCreateWarranty(dealer.id, tenantId, {
      ...baseWarrantyData, amountPaid: 83400, currency: 'SYP', engineType: 'HYBRID',
    } as any);

    const data = (prisma.dealerWarranty.create as jest.Mock).mock.calls[0][0].data;
    expect(data.customerPaidUSD).toBe(600);
    expect(data.companyShareUSD).toBe(300);
  });

  it('rejects a customer price below the company share', async () => {
    (prisma.dealer.findFirst as jest.Mock).mockResolvedValue(dealer);
    await expect(service.adminCreateWarranty(dealer.id, tenantId, {
      ...baseWarrantyData, amountPaid: 200, engineType: 'HYBRID',
    } as any)).rejects.toThrow('below the company share');
  });

  it('records a dealer receipt atomically and posts revenue only on receipt', async () => {
    const warranty = { id: 'w-1', tenantId, companyShareUSD: 300, deletedAt: null };
    (prisma.dealerWarranty.findFirst as jest.Mock).mockResolvedValue(warranty);
    (prisma.dealerWarrantyReceipt.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.dealerWarrantyReceipt.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountUSD: 100 } });
    (prisma.dealerWarrantyReceipt.create as jest.Mock).mockImplementation(({ data }) => Promise.resolve({ id: 'r-1', ...data }));

    const receipt = await service.recordWarrantyReceipt('w-1', tenantId, {
      amount: 200, currency: 'USD', paymentMethod: 'CASH', idempotencyKey: 'k-1',
    });

    expect(receipt.amountUSD).toBe(200);
    expect(receipt.amountSYP).toBe(200 * 139);
    expect(createDealerWarrantyReceiptJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'r-1' }), tenantId, null, prisma
    );
  });

  it('rejects a receipt that exceeds the outstanding company share', async () => {
    const warranty = { id: 'w-1', tenantId, companyShareUSD: 300, deletedAt: null };
    (prisma.dealerWarranty.findFirst as jest.Mock).mockResolvedValue(warranty);
    (prisma.dealerWarrantyReceipt.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.dealerWarrantyReceipt.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountUSD: 250 } });

    await expect(service.recordWarrantyReceipt('w-1', tenantId, {
      amount: 60, currency: 'USD', paymentMethod: 'CASH',
    })).rejects.toThrow('exceeds outstanding');
    expect(prisma.dealerWarrantyReceipt.create).not.toHaveBeenCalled();
  });

  it('returns the existing receipt for a duplicate idempotency key', async () => {
    const warranty = { id: 'w-1', tenantId, companyShareUSD: 300, deletedAt: null };
    const existing = { id: 'r-dup', dealerWarrantyId: 'w-1' };
    (prisma.dealerWarranty.findFirst as jest.Mock).mockResolvedValue(warranty);
    (prisma.dealerWarrantyReceipt.findFirst as jest.Mock).mockResolvedValue(existing);

    const result = await service.recordWarrantyReceipt('w-1', tenantId, {
      amount: 100, currency: 'USD', paymentMethod: 'CASH', idempotencyKey: 'dup-key',
    });
    expect(result).toBe(existing);
    expect(prisma.dealerWarrantyReceipt.create).not.toHaveBeenCalled();
  });

  it('voids a receipt by soft-deleting it and reversing its journal atomically', async () => {
    const receipt = { id: 'r-1', tenantId, deletedAt: null };
    const journal = { id: 'j-1' };
    (prisma.dealerWarrantyReceipt.findFirst as jest.Mock).mockResolvedValue(receipt);
    (prisma.journalEntry.findFirst as jest.Mock).mockResolvedValue(journal);

    await service.voidWarrantyReceipt('r-1', tenantId, 'user-1');

    expect(prisma.dealerWarrantyReceipt.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'r-1' },
      data: expect.objectContaining({ deletedAt: expect.any(Date) }),
    }));
    expect(reverseJournalEntry).toHaveBeenCalledWith('j-1', 'Warranty receipt voided', tenantId, 'user-1', prisma);
  });
});
