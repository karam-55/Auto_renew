export {};

const prismaMock: any = {
  customer: { findFirst: jest.fn() },
  vehicle: { findFirst: jest.fn() },
  service: { findMany: jest.fn() },
  booking: { create: jest.fn() },
};

jest.doMock('../../src/config/database', () => ({ __esModule: true, default: prismaMock }));
jest.doMock('../../src/modules/whatsapp/service', () => ({
  WhatsAppService: jest.fn().mockImplementation(() => ({ setIo: jest.fn() })),
}));
jest.doMock('../../src/modules/fcm/service', () => ({
  FCMService: jest.fn().mockImplementation(() => ({ setIo: jest.fn() })),
}));
jest.doMock('../../src/modules/notifications/telegram-admin-notification.service', () => ({
  TelegramAdminNotificationService: jest.fn().mockImplementation(() => ({
    notifyBookingCreated: jest.fn(),
  })),
}));
jest.doMock('../../src/modules/schedule/schedule.service', () => ({
  ScheduleService: jest.fn().mockImplementation(() => ({ createScheduleForBooking: jest.fn() })),
}));
jest.doMock('../../src/modules/vehicles/service', () => ({
  VehicleService: jest.fn().mockImplementation(() => ({ updateLastServiceDate: jest.fn() })),
}));
jest.doMock('../../src/modules/vehicles/vehicle.service', () => ({
  VehicleService: jest.fn().mockImplementation(() => ({ addHistoryEntry: jest.fn() })),
}));

const { BookingService } = require('../../src/modules/bookings/service');

describe('booking work-order initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.customer.findFirst.mockResolvedValue({ id: 'customer-1', tenantId: 'tenant-1', phone: '0900000000' });
    prismaMock.vehicle.findFirst.mockResolvedValue({ id: 'vehicle-1', tenantId: 'tenant-1', make: 'BYD', model: 'Qin' });
    prismaMock.service.findMany.mockResolvedValue([{
      id: 'service-1',
      tenantId: 'tenant-1',
      name: 'تبديل زيت',
      nameAr: 'تبديل زيت',
      serviceType: 'OIL_PAID',
      priceSYP: 9000,
      priceUSD: 9,
      category: null,
      duration: 30,
      basePrice: 9000,
    }]);
    prismaMock.booking.create.mockResolvedValue({
      id: 'booking-1',
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      vehicleId: 'vehicle-1',
      status: 'PENDING',
      scheduledDate: new Date('2026-10-16'),
      customer: { id: 'customer-1', fullName: 'Customer', phone: '0900000000' },
      vehicle: { id: 'vehicle-1', make: 'BYD', model: 'Qin', year: 2024, licensePlate: '123' },
      bookingServices: [{
        id: 'booking-service-1',
        serviceId: 'service-1',
        quantity: 1,
        priceSYP: 0,
        priceUSD: 0,
        priceFinalized: false,
        service: { id: 'service-1', name: 'تبديل زيت', serviceType: 'OIL_PAID', category: null, duration: 30, basePrice: 9000 },
        materials: [],
      }],
      workOrder: { id: 'work-order-1', status: 'OPEN' },
      mechanicAssignments: [],
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('creates one linked open work order and leaves the service price unfinalized at booking', async () => {
    jest.spyOn(global, 'setImmediate').mockImplementation((() => ({ unref: jest.fn() })) as any);
    const service = new BookingService();
    const result = await service.createBooking('tenant-1', {
      customerId: 'customer-1',
      vehicleId: 'vehicle-1',
      scheduledDate: new Date('2026-10-16'),
      services: [{ serviceId: 'service-1' }],
    });

    const createArgs = prismaMock.booking.create.mock.calls[0][0];
    expect(createArgs.data.workOrder.create).toEqual(expect.objectContaining({
      tenantId: 'tenant-1',
      status: 'OPEN',
    }));
    expect(createArgs.data.bookingServices.create[0]).toEqual(expect.objectContaining({
      serviceId: 'service-1',
      priceSYP: 0,
      priceUSD: 0,
      priceFinalized: false,
    }));
    expect(result.workOrder).toEqual({ id: 'work-order-1', status: 'OPEN' });
  });
});
