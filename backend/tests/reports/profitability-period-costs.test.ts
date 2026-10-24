export {};

const prismaMock: any = {
  journalLine: { findMany: jest.fn() },
  bookingJobCost: { findMany: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));

const { ProfitabilityService } = require('../../src/modules/reports/profitability.service');

describe('profitability report period filtering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('limits analytical labor to the requested period', async () => {
    prismaMock.journalLine.findMany.mockResolvedValue([{
      id: 'revenue-line',
      entryId: 'entry-1',
      serviceId: 'service-1',
      debitSYP: 0,
      creditSYP: 1000,
      debitUSD: 0,
      creditUSD: 10,
      account: { accountType: 'REVENUE' },
      service: { id: 'service-1', name: 'Service', nameAr: 'خدمة' },
      booking: { id: 'booking-1', scheduledDate: new Date('2026-10-17T00:00:00.000Z') },
      costCenter: null,
    }]);
    prismaMock.bookingJobCost.findMany.mockResolvedValue([{
      bookingId: 'booking-1',
      serviceId: 'service-1',
      costCenterId: null,
      laborCost: 100,
      laborCostUSD: 1,
    }]);
    const from = new Date('2026-10-01T00:00:00.000Z');
    const to = new Date('2026-10-31T23:59:59.999Z');

    const report = await new ProfitabilityService().calculateServiceProfit('tenant-1', from, to);

    expect(prismaMock.bookingJobCost.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        serviceId: { not: '' },
        createdAt: { gte: from, lte: to },
      }),
    }));
    expect(report[0]).toEqual(expect.objectContaining({
      revenueSYP: 1000,
      analyticalLaborCostSYP: 100,
      grossProfitAfterAnalyticalLaborSYP: 900,
    }));
  });
});
