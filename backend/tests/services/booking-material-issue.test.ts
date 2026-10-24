export {};

const tx: any = {
  booking: { findFirst: jest.fn() },
  part: { updateMany: jest.fn() },
  bookingServiceMaterial: { updateMany: jest.fn() },
  inventoryTransaction: { findFirst: jest.fn(), create: jest.fn() },
};

const prismaMock: any = {
  $transaction: jest.fn((callback: any) => callback(tx)),
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));
jest.doMock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getRequiredExchangeRate: jest.fn().mockResolvedValue(1000) },
}));
jest.doMock('../../src/modules/accounting/automatic-journal-entries', () => ({
  ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
  createStockConsumptionJournalEntry: jest.fn().mockResolvedValue({ id: 'journal-1' }),
}));

const { BookingService } = require('../../src/modules/bookings/service');
const { createStockConsumptionJournalEntry } = require('../../src/modules/accounting/automatic-journal-entries');

describe('work-order material issue', () => {
  const service = new BookingService();

  const makeBooking = (issuedQuantity = 0) => ({
    id: 'booking-1',
    status: 'IN_PROGRESS',
    bookingServices: [{
      id: 'booking-service-1',
      serviceId: 'service-1',
      service: { category: { costCenterId: 'center-1' } },
      materials: [{
        id: 'material-1',
        bookingServiceId: 'booking-service-1',
        partId: 'part-1',
        quantity: 3.5,
        issuedQuantity,
        part: {
          id: 'part-1',
          tenantId: 'tenant-1',
          name: 'زيت محرك',
          costSYP: 12000,
          costUSD: 12,
        },
      }],
    }],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tx.booking.findFirst.mockResolvedValue(makeBooking());
    tx.part.updateMany.mockResolvedValue({ count: 1 });
    tx.bookingServiceMaterial.updateMany.mockResolvedValue({ count: 1 });
    tx.inventoryTransaction.findFirst.mockResolvedValue(null);
    tx.inventoryTransaction.create.mockResolvedValue({
      id: 'movement-1',
      partId: 'part-1',
      type: 'CONSUMPTION',
      quantity: 3.5,
      costSYP: 12000,
      costUSD: 12,
      createdAt: new Date('2026-10-16'),
    });
  });

  it('issues fractional quantities, reduces stock, and posts the linked cost once', async () => {
    const result = await service.issueWorkOrderMaterials('tenant-1', 'booking-1', 'user-1', [
      { materialId: 'material-1', quantity: 3.5 },
    ], 'issue-request-1');

    expect(result.issuedCount).toBe(1);
    expect(result.totalCostSYP).toBe(42000);
    expect(tx.part.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'part-1', tenantId: 'tenant-1', quantity: { gte: 3.5 } },
      data: { quantity: { decrement: 3.5 } },
    }));
    expect(tx.inventoryTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        bookingId: 'booking-1',
        bookingServiceId: 'booking-service-1',
        bookingServiceMaterialId: 'material-1',
        serviceId: 'service-1',
        costCenterId: 'center-1',
        quantity: 3.5,
      }),
    }));
    expect(createStockConsumptionJournalEntry).toHaveBeenCalledTimes(1);
  });

  it('refuses to issue the same planned quantity twice', async () => {
    tx.booking.findFirst.mockResolvedValue(makeBooking(3.5));
    await expect(service.issueWorkOrderMaterials('tenant-1', 'booking-1', 'user-1', [
      { materialId: 'material-1', quantity: 3.5 },
    ], 'issue-request-2')).rejects.toThrow('exceeds the remaining planned quantity');

    expect(tx.part.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryTransaction.create).not.toHaveBeenCalled();
  });

  it('fails atomically when stock is insufficient', async () => {
    tx.part.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.issueWorkOrderMaterials('tenant-1', 'booking-1', 'user-1', [
      { materialId: 'material-1', quantity: 3.5 },
    ], 'issue-request-3'))
      .rejects.toThrow('Insufficient stock');
    expect(tx.bookingServiceMaterial.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryTransaction.create).not.toHaveBeenCalled();
    expect(createStockConsumptionJournalEntry).not.toHaveBeenCalled();
  });
});
