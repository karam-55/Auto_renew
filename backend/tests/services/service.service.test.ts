import { ServiceService } from '../../src/modules/services/service';
import prisma from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    service: { findMany: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
    serviceCategory: { findFirst: jest.fn(), create: jest.fn() },
  },
}));
jest.mock('../../src/services/settings.service', () => ({
  __esModule: true,
  default: { getSettings: jest.fn().mockResolvedValue({ exchangeRate: 139 }) },
}));

describe('ServiceService live master-data currency mapping', () => {
  let service: ServiceService;
  const tenantId = 'tenant-1';

  beforeEach(() => {
    service = new ServiceService();
    jest.clearAllMocks();
  });

  it('derives live SYP prices and costs from stored USD master values', async () => {
    (prisma.service.findMany as jest.Mock).mockResolvedValue([{
      id: 'service-1', tenantId, name: 'Oil change', basePrice: 1000,
      priceSYP: 1000, priceUSD: 10,
      laborCostSYP: 500, laborCostUSD: 5,
      materialCostSYP: 250, materialCostUSD: 2,
      profitAmountSYP: 250, profitAmountUSD: 2,
      isActive: true, serviceParts: [],
    }]);

    const [result] = await service.getAllServices(tenantId);

    expect(result.priceSYP).toBe(1390);
    expect(result.basePrice).toBe(1390);
    expect(result.laborCostSYP).toBe(695);
    expect(result.materialCostSYP).toBe(278);
    expect(result.profitAmountSYP).toBe(278);
    expect(result.priceUSD).toBe(10);
  });

  it('returns no services for an unknown category without creating one during a read', async () => {
    (prisma.serviceCategory.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getServicesByCategory(tenantId, 'unknown department')).resolves.toEqual([]);

    expect(prisma.serviceCategory.create).not.toHaveBeenCalled();
    expect(prisma.service.findMany).not.toHaveBeenCalled();
  });

  it('soft-deletes a service so bookings and posted invoices retain their reference', async () => {
    (prisma.service.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

    await service.deleteService(tenantId, 'service-1');

    expect(prisma.service.updateMany).toHaveBeenCalledWith({
      where: { id: 'service-1', tenantId, deletedAt: null },
      data: { isActive: false, deletedAt: expect.any(Date) },
    });
  });
});
