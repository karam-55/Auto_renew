import { SupplierService } from '../../src/modules/suppliers/service';
import { SupplierStatus } from '@prisma/client';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    supplier: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    part: {
      count: jest.fn(),
    },
    purchaseOrder: {
      count: jest.fn(),
    },
  },
}));

describe('SupplierService', () => {
  let supplierService: SupplierService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    supplierService = new SupplierService();
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a new supplier', async () => {
      const supplierData = {
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
        address: 'Dubai Industrial Area',
        contactPerson: 'John Smith',
        contactPhone: '+971509876543',
        taxId: 'TAX-12345',
        paymentTerms: 'NET 30',
        creditLimit: 50000,
        notes: 'Primary supplier for brake parts',
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: supplierData.name,
        phone: supplierData.phone,
        address: supplierData.address,
        contactPerson: supplierData.contactPerson,
        contactPhone: supplierData.contactPhone,
        taxId: supplierData.taxId,
        paymentTerms: supplierData.paymentTerms,
        creditLimit: '50000',
        balance: '0',
        status: 'ACTIVE' as SupplierStatus,
        notes: supplierData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.create as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await supplierService.createSupplier(mockTenantId, supplierData);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, phone: supplierData.phone },
      });
      expect(prisma.supplier.create).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockSupplier,
        creditLimit: 50000,
        balance: 0,
      });
    });

    it('should throw error if phone already exists', async () => {
      const supplierData = {
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-supplier' });

      await expect(supplierService.createSupplier(mockTenantId, supplierData)).rejects.toThrow(
        'Supplier with this phone number already exists'
      );
    });

    it('should create supplier with minimal required fields', async () => {
      const supplierData = {
        name: 'Basic Supplier',
        phone: '+971555555555',
      };

      const mockSupplier = {
        id: 'supplier-2',
        tenantId: mockTenantId,
        name: supplierData.name,
        phone: supplierData.phone,
        address: null,
        contactPerson: null,
        contactPhone: null,
        taxId: null,
        paymentTerms: null,
        creditLimit: null,
        balance: '0',
        status: 'ACTIVE' as SupplierStatus,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.create as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await supplierService.createSupplier(mockTenantId, supplierData);

      expect(result.creditLimit).toBeNull();
      expect(result.balance).toBe(0);
    });
  });

  describe('getSuppliers', () => {
    it('should return all suppliers for a tenant', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          tenantId: mockTenantId,
          name: 'Auto Parts Supplier',
          phone: '+971501234567',
          address: 'Dubai',
          contactPerson: 'John Smith',
          contactPhone: '+971509876543',
          taxId: 'TAX-12345',
          paymentTerms: 'NET 30',
          creditLimit: '50000',
          balance: '10000',
          status: 'ACTIVE' as SupplierStatus,
          notes: 'Primary supplier',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

      const result = await supplierService.getSuppliers(mockTenantId);

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].creditLimit).toBe(50000);
      expect(result[0].balance).toBe(10000);
    });

    it('should filter suppliers by status', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          tenantId: mockTenantId,
          name: 'Active Supplier',
          phone: '+971501234567',
          address: 'Dubai',
          contactPerson: 'John Smith',
          contactPhone: '+971509876543',
          taxId: 'TAX-12345',
          paymentTerms: 'NET 30',
          creditLimit: '50000',
          balance: '10000',
          status: 'ACTIVE' as SupplierStatus,
          notes: 'Primary supplier',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

      const result = await supplierService.getSuppliers(mockTenantId, { status: SupplierStatus.ACTIVE });

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, status: SupplierStatus.ACTIVE },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no suppliers exist', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      const result = await supplierService.getSuppliers(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('getSupplierById', () => {
    it('should return supplier by id', async () => {
      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
        address: 'Dubai',
        contactPerson: 'John Smith',
        contactPhone: '+971509876543',
        taxId: 'TAX-12345',
        paymentTerms: 'NET 30',
        creditLimit: '50000',
        balance: '10000',
        status: 'ACTIVE' as SupplierStatus,
        notes: 'Primary supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await supplierService.getSupplierById('supplier-1', mockTenantId);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'supplier-1', tenantId: mockTenantId },
        select: expect.any(Object),
      });
      expect(result).toEqual({
        ...mockSupplier,
        creditLimit: 50000,
        balance: 10000,
      });
    });

    it('should return null when supplier not found', async () => {
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await supplierService.getSupplierById('non-existent', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('updateSupplier', () => {
    it('should update an existing supplier', async () => {
      const supplierId = 'supplier-1';
      const updateData = {
        name: 'Updated Supplier Name',
        paymentTerms: 'NET 45',
      };

      const mockExistingSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
        address: 'Dubai',
        contactPerson: 'John Smith',
        contactPhone: '+971509876543',
        taxId: 'TAX-12345',
        paymentTerms: 'NET 30',
        creditLimit: '50000',
        balance: '10000',
        status: 'ACTIVE' as SupplierStatus,
        notes: 'Primary supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedSupplier = {
        ...mockExistingSupplier,
        name: updateData.name,
        paymentTerms: updateData.paymentTerms,
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockExistingSupplier);
      (prisma.supplier.update as jest.Mock).mockResolvedValue(mockUpdatedSupplier);

      const result = await supplierService.updateSupplier(supplierId, mockTenantId, updateData);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: supplierId, tenantId: mockTenantId },
      });
      expect(prisma.supplier.update).toHaveBeenCalled();
      expect(result.name).toBe(updateData.name);
      expect(result.paymentTerms).toBe(updateData.paymentTerms);
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 'non-existent-supplier';
      const updateData = { name: 'Updated Name' };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(supplierService.updateSupplier(supplierId, mockTenantId, updateData)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should throw error if phone already exists when updating phone', async () => {
      const supplierId = 'supplier-1';
      const updateData = {
        phone: '+971555555555',
      };

      const mockExistingSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      (prisma.supplier.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockExistingSupplier)
        .mockResolvedValueOnce({ id: 'another-supplier' });

      await expect(supplierService.updateSupplier(supplierId, mockTenantId, updateData)).rejects.toThrow(
        'Supplier with this phone number already exists'
      );
    });

    it('should allow updating phone to same value', async () => {
      const supplierId = 'supplier-1';
      const updateData = {
        phone: '+971501234567',
      };

      const mockExistingSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      const mockUpdatedSupplier = {
        ...mockExistingSupplier,
        phone: updateData.phone,
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockExistingSupplier);
      (prisma.supplier.update as jest.Mock).mockResolvedValue(mockUpdatedSupplier);

      const result = await supplierService.updateSupplier(supplierId, mockTenantId, updateData);

      expect(result.phone).toBe(updateData.phone);
    });
  });

  describe('deleteSupplier', () => {
    it('should delete a supplier', async () => {
      const supplierId = 'supplier-1';
      const mockSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.part.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(0);
      (prisma.supplier.delete as jest.Mock).mockResolvedValue(mockSupplier);

      await supplierService.deleteSupplier(supplierId, mockTenantId);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: supplierId, tenantId: mockTenantId },
      });
      expect(prisma.part.count).toHaveBeenCalledWith({
        where: { supplierId, tenantId: mockTenantId },
      });
      expect(prisma.purchaseOrder.count).toHaveBeenCalledWith({
        where: { supplierId, tenantId: mockTenantId },
      });
      expect(prisma.supplier.delete).toHaveBeenCalledWith({
        where: { id: supplierId },
      });
    });

    it('should throw error if supplier not found', async () => {
      const supplierId = 'non-existent-supplier';

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(supplierService.deleteSupplier(supplierId, mockTenantId)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should throw error if supplier has existing parts', async () => {
      const supplierId = 'supplier-1';
      const mockSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.part.count as jest.Mock).mockResolvedValue(5);

      await expect(supplierService.deleteSupplier(supplierId, mockTenantId)).rejects.toThrow(
        'Cannot delete supplier with existing parts'
      );
    });

    it('should throw error if supplier has existing purchase orders', async () => {
      const supplierId = 'supplier-1';
      const mockSupplier = {
        id: supplierId,
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.part.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(3);

      await expect(supplierService.deleteSupplier(supplierId, mockTenantId)).rejects.toThrow(
        'Cannot delete supplier with existing purchase orders'
      );
    });
  });

  describe('searchSuppliers', () => {
    it('should search suppliers by name', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          tenantId: mockTenantId,
          name: 'Auto Parts Supplier',
          phone: '+971501234567',
          address: 'Dubai',
          contactPerson: 'John Smith',
          contactPhone: '+971509876543',
          taxId: 'TAX-12345',
          paymentTerms: 'NET 30',
          creditLimit: '50000',
          balance: '10000',
          status: 'ACTIVE' as SupplierStatus,
          notes: 'Primary supplier',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

      const result = await supplierService.searchSuppliers(mockTenantId, 'Auto');

      expect(prisma.supplier.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: expect.arrayContaining([
            { name: { contains: 'Auto', mode: 'insensitive' } },
            { phone: { contains: 'Auto' } },
            { contactPerson: { contains: 'Auto', mode: 'insensitive' } },
            { contactPhone: { contains: 'Auto' } },
            { taxId: { contains: 'Auto', mode: 'insensitive' } },
          ]),
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should search suppliers by phone', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          tenantId: mockTenantId,
          name: 'Auto Parts Supplier',
          phone: '+971501234567',
          address: 'Dubai',
          contactPerson: 'John Smith',
          contactPhone: '+971509876543',
          taxId: 'TAX-12345',
          paymentTerms: 'NET 30',
          creditLimit: '50000',
          balance: '10000',
          status: 'ACTIVE' as SupplierStatus,
          notes: 'Primary supplier',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.supplier.findMany as jest.Mock).mockResolvedValue(mockSuppliers);

      const result = await supplierService.searchSuppliers(mockTenantId, '+971501234567');

      expect(prisma.supplier.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no results found', async () => {
      (prisma.supplier.findMany as jest.Mock).mockResolvedValue([]);

      const result = await supplierService.searchSuppliers(mockTenantId, 'NonExistent');

      expect(result).toEqual([]);
    });
  });
});
