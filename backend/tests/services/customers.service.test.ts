import { CustomerService } from '../../src/modules/customers/service';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    customer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('CustomerService', () => {
  let customerService: CustomerService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    customerService = new CustomerService();
    jest.clearAllMocks();
  });

  describe('getAllCustomers', () => {
    it('should return all customers for a tenant', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          tenantId: mockTenantId,
          fullName: 'Ahmed Ali',
          phone: '+971501234567',
          address: 'Dubai',
          city: 'Dubai',
          notes: 'VIP customer',
          loyaltyPoints: 100,
          isVip: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const result = await customerService.getAllCustomers(mockTenantId);

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          address: true,
          city: true,
          notes: true,
          loyaltyPoints: true,
          isVip: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const customerData = {
        fullName: 'Mohammed Hassan',
        phone: '+971509876543',
        address: 'Abu Dhabi',
        city: 'Abu Dhabi',
      };

      const mockCustomer = {
        id: 'customer-2',
        tenantId: mockTenantId,
        fullName: customerData.fullName,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        notes: null,
        loyaltyPoints: 0,
        isVip: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.customer.create as jest.Mock).mockResolvedValue(mockCustomer);

      const result = await customerService.createCustomer(mockTenantId, customerData);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, phone: customerData.phone },
      });
      expect(prisma.customer.create).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
    });

    it('should throw error if phone already exists', async () => {
      const customerData = {
        fullName: 'Mohammed Hassan',
        phone: '+971501234567', // existing phone
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-customer' });

      await expect(customerService.createCustomer(mockTenantId, customerData)).rejects.toThrow(
        'Customer with this phone number already exists'
      );
    });
  });

  describe('addLoyaltyPoints', () => {
    it('should add loyalty points to a customer', async () => {
      const customerId = 'customer-1';
      const pointsToAdd = 50;

      const mockCustomer = {
        id: customerId,
        tenantId: mockTenantId,
        fullName: 'Ahmed Ali',
        phone: '+971501234567',
        loyaltyPoints: 100,
        isVip: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedCustomer = {
        ...mockCustomer,
        loyaltyPoints: 150,
      };

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (prisma.customer.update as jest.Mock).mockResolvedValue(mockUpdatedCustomer);

      const result = await customerService.addLoyaltyPoints(mockTenantId, customerId, pointsToAdd);

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: customerId, tenantId: mockTenantId },
      });
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: pointsToAdd,
          },
        },
        select: expect.any(Object),
      });
      expect(result.loyaltyPoints).toBe(150);
    });

    it('should throw error if customer not found', async () => {
      const customerId = 'non-existent-customer';

      (prisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        customerService.addLoyaltyPoints(mockTenantId, customerId, 50)
      ).rejects.toThrow('Customer not found');
    });
  });
});
