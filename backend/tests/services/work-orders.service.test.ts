export {};

const tx: any = {
  bookingService: { update: jest.fn(), findUnique: jest.fn() },
  bookingServiceMaterial: { create: jest.fn() },
  workOrder: { update: jest.fn() },
};
const prismaMock: any = {
  workOrder: { findFirst: jest.fn(), update: jest.fn(), upsert: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  booking: { findFirst: jest.fn(), update: jest.fn() },
  bookingService: { findFirst: jest.fn(), findUnique: jest.fn() },
  bookingServiceMaterial: { findMany: jest.fn() },
  bookingJobCost: { findMany: jest.fn() },
  part: { findFirst: jest.fn() },
  $transaction: jest.fn((callback: any) => callback(tx)),
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));
jest.doMock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getRequiredExchangeRate: jest.fn().mockResolvedValue(1000) },
}));
jest.doMock('../../src/modules/invoices/service', () => ({
  InvoiceService: jest.fn().mockImplementation(() => ({
    createAndFinalizeWorkOrderInvoice: jest.fn(),
  })),
}));

const { WorkOrderService } = require('../../src/modules/work-orders/service');

describe('WorkOrderService', () => {
  const service = new WorkOrderService();

  beforeEach(() => {
    jest.clearAllMocks();
    tx.bookingServiceMaterial.create.mockResolvedValue({ id: 'material-1', quantity: 8 });
    tx.bookingService.update.mockResolvedValue({});
    tx.workOrder.update.mockResolvedValue({});
    prismaMock.workOrder.findFirst.mockResolvedValue({
      id: 'work-order-1',
      bookingId: 'booking-1',
      status: 'OPEN',
    });
    prismaMock.bookingService.findFirst.mockResolvedValue({
      id: 'booking-service-1',
      quantity: 1,
      service: { serviceType: 'OIL_PAID' },
    });
    prismaMock.part.findFirst.mockResolvedValue({
      id: 'part-1',
      quantity: 20,
      unitsPerPackage: 4,
      purchaseUnitName: 'علبة',
      baseUnitName: 'لتر',
    });
    prismaMock.bookingServiceMaterial.findMany.mockResolvedValue([]);
  });

  it('converts package counts to inventory base units and prices oil materials from stock at invoice time', async () => {
    const result = await service.addInventoryMaterial('tenant-1', 'work-order-1', {
      bookingServiceId: 'booking-service-1',
      partId: 'part-1',
      quantity: 2,
      quantityUnit: 'PACKAGE',
    });

    expect(tx.bookingServiceMaterial.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { bookingServiceId: 'booking-service-1', partId: 'part-1', quantity: 8 },
    }));
    expect(tx.bookingService.update).toHaveBeenCalledWith({
      where: { id: 'booking-service-1' },
      data: { priceSYP: 0, priceUSD: 0, priceFinalized: true },
    });
    expect(result.quantity).toBe(8);
  });

  it('refuses stock quantities above currently available stock', async () => {
    prismaMock.part.findFirst.mockResolvedValueOnce({
      id: 'part-1',
      quantity: 3,
      unitsPerPackage: 4,
      baseUnitName: 'لتر',
    });

    await expect(service.addInventoryMaterial('tenant-1', 'work-order-1', {
      bookingServiceId: 'booking-service-1',
      partId: 'part-1',
      quantity: 1,
      quantityUnit: 'PACKAGE',
    })).rejects.toThrow('Available stock is 3.000');

    expect(tx.bookingServiceMaterial.create).not.toHaveBeenCalled();
  });

  it('finalizes a service price using the configured exchange rate', async () => {
    await service.setServicePrice('tenant-1', 'work-order-1', 'booking-service-1', {
      priceUSD: 25,
      quantity: 2,
    });

    expect(tx.bookingService.update).toHaveBeenCalledWith({
      where: { id: 'booking-service-1' },
      data: { priceSYP: 25000, priceUSD: 25, quantity: 2, priceFinalized: true },
    });
    expect(tx.workOrder.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'work-order-1' },
      data: expect.objectContaining({ status: 'IN_PROGRESS' }),
    }));
  });
});
