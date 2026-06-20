import { PartService } from '../../src/modules/parts/service';
import { PartStatus } from '../../src/modules/parts/types';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    part: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    inventoryTransaction: {
      count: jest.fn(),
    },
    purchaseOrderItem: {
      count: jest.fn(),
    },
    invoiceItem: {
      count: jest.fn(),
    },
  },
}));

describe('PartService', () => {
  let partService: PartService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    partService = new PartService();
    jest.clearAllMocks();
  });

  describe('createPart', () => {
    it('should create a new part', async () => {
      const partData = {
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        nameAr: 'وسادة الفرامل',
        nameEn: 'Brake Pad',
        description: 'High-quality brake pad for sedans',
        categoryId: 'category-1',
        supplierId: 'supplier-1',
        costSYP: 50000,
        costUSD: 33.33,
        sellingPriceSYP: 75000,
        sellingPriceUSD: 50,
        quantity: 100,
        minQuantity: 10,
        location: 'A-1-1',
        isActive: true,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        ...partData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.part.create as jest.Mock).mockResolvedValue(mockPart);

      const result = await partService.createPart(mockTenantId, partData);

      expect(prisma.part.findUnique).toHaveBeenCalledWith({
        where: { partNumber: partData.partNumber },
      });
      expect(prisma.part.create).toHaveBeenCalled();
      expect(result.partNumber).toBe(partData.partNumber);
      expect(result.costSYP).toBe(50000);
    });

    it('should throw error if part number already exists', async () => {
      const partData = {
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        costSYP: 50000,
        sellingPriceSYP: 75000,
      };

      (prisma.part.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-part' });

      await expect(partService.createPart(mockTenantId, partData)).rejects.toThrow(
        'Part with this part number already exists'
      );
    });

    it('should create part with minimal required fields', async () => {
      const partData = {
        partNumber: 'OIL-001',
        name: 'Engine Oil',
        costSYP: 25000,
        sellingPriceSYP: 35000,
      };

      const mockPart = {
        id: 'part-2',
        tenantId: mockTenantId,
        partNumber: partData.partNumber,
        name: partData.name,
        nameAr: null,
        nameEn: null,
        description: null,
        categoryId: null,
        supplierId: null,
        costSYP: partData.costSYP,
        costUSD: null,
        sellingPriceSYP: partData.sellingPriceSYP,
        sellingPriceUSD: null,
        quantity: 0,
        minQuantity: 5,
        location: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.part.create as jest.Mock).mockResolvedValue(mockPart);

      const result = await partService.createPart(mockTenantId, partData);

      expect(result.quantity).toBe(0);
      expect(result.minQuantity).toBe(5);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getParts', () => {
    it('should return all parts for a tenant', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          nameAr: 'وسادة الفرامل',
          nameEn: 'Brake Pad',
          description: 'High-quality brake pad',
          categoryId: 'category-1',
          supplierId: 'supplier-1',
          costSYP: 50000,
          costUSD: 33.33,
          sellingPriceSYP: 75000,
          sellingPriceUSD: 50,
          quantity: 100,
          minQuantity: 10,
          location: 'A-1-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId);

      expect(prisma.part.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].costSYP).toBe(50000);
    });

    it('should filter parts by category', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          categoryId: 'category-1',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId, { categoryId: 'category-1' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter parts by supplier', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          supplierId: 'supplier-1',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId, { supplierId: 'supplier-1' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter parts by status', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId, { status: PartStatus.ACTIVE });

      expect(result.data).toHaveLength(1);
    });

    it('should filter parts by quantity range', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 50,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId, { minQuantity: 10, maxQuantity: 100 });

      expect(result.data).toHaveLength(1);
    });

    it('should search parts by name or part number', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(1);

      const result = await partService.getParts(mockTenantId, { search: 'Brake' });

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);
      (prisma.part.count as jest.Mock).mockResolvedValue(25);

      const result = await partService.getParts(mockTenantId, {}, { page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getPartById', () => {
    it('should return part by id', async () => {
      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        costSYP: 50000,
        sellingPriceSYP: 75000,
        quantity: 100,
        minQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);

      const result = await partService.getPartById('part-1', mockTenantId);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: 'part-1', tenantId: mockTenantId },
      });
      expect(result).toEqual(mockPart);
    });

    it('should return null when part not found', async () => {
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await partService.getPartById('non-existent', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('updatePart', () => {
    it('should update an existing part', async () => {
      const partId = 'part-1';
      const updateData = {
        name: 'Updated Brake Pad',
        sellingPriceSYP: 80000,
      };

      const mockExistingPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        costSYP: 50000,
        sellingPriceSYP: 75000,
        quantity: 100,
        minQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedPart = {
        ...mockExistingPart,
        name: updateData.name,
        sellingPriceSYP: updateData.sellingPriceSYP,
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockExistingPart);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockUpdatedPart);

      const result = await partService.updatePart(partId, mockTenantId, updateData);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: partId, tenantId: mockTenantId },
      });
      expect(prisma.part.update).toHaveBeenCalled();
      expect(result.name).toBe(updateData.name);
      expect(result.sellingPriceSYP).toBe(updateData.sellingPriceSYP);
    });

    it('should throw error if part not found', async () => {
      const partId = 'non-existent-part';
      const updateData = { name: 'Updated Name' };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(partService.updatePart(partId, mockTenantId, updateData)).rejects.toThrow(
        'Part not found'
      );
    });

    it('should throw error if part number already exists when updating', async () => {
      const partId = 'part-1';
      const updateData = {
        partNumber: 'BRK-002',
      };

      const mockExistingPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockExistingPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue({ id: 'another-part' });

      await expect(partService.updatePart(partId, mockTenantId, updateData)).rejects.toThrow(
        'Part with this part number already exists'
      );
    });
  });

  describe('deletePart', () => {
    it('should delete a part', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(0);
      (prisma.invoiceItem.count as jest.Mock).mockResolvedValue(0);
      (prisma.part.delete as jest.Mock).mockResolvedValue(mockPart);

      await partService.deletePart(partId, mockTenantId);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: partId, tenantId: mockTenantId },
      });
      expect(prisma.inventoryTransaction.count).toHaveBeenCalledWith({
        where: { partId },
      });
      expect(prisma.purchaseOrderItem.count).toHaveBeenCalledWith({
        where: { partId },
      });
      expect(prisma.invoiceItem.count).toHaveBeenCalledWith({
        where: { partId },
      });
      expect(prisma.part.delete).toHaveBeenCalledWith({
        where: { id: partId },
      });
    });

    it('should throw error if part not found', async () => {
      const partId = 'non-existent-part';

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(partService.deletePart(partId, mockTenantId)).rejects.toThrow('Part not found');
    });

    it('should throw error if part has existing inventory transactions', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(5);

      await expect(partService.deletePart(partId, mockTenantId)).rejects.toThrow(
        'Cannot delete part with existing inventory transactions'
      );
    });

    it('should throw error if part has existing purchase order items', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(3);

      await expect(partService.deletePart(partId, mockTenantId)).rejects.toThrow(
        'Cannot delete part with existing purchase order items'
      );
    });

    it('should throw error if part has existing invoice items', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(0);
      (prisma.invoiceItem.count as jest.Mock).mockResolvedValue(2);

      await expect(partService.deletePart(partId, mockTenantId)).rejects.toThrow(
        'Cannot delete part with existing invoice items'
      );
    });
  });

  describe('searchParts', () => {
    it('should search parts by name', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const result = await partService.searchParts(mockTenantId, 'Brake');

      expect(prisma.part.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          OR: expect.arrayContaining([
            { name: { contains: 'Brake', mode: 'insensitive' } },
            { nameAr: { contains: 'Brake', mode: 'insensitive' } },
            { nameEn: { contains: 'Brake', mode: 'insensitive' } },
            { partNumber: { contains: 'Brake', mode: 'insensitive' } },
            { description: { contains: 'Brake', mode: 'insensitive' } },
          ]),
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(1);
    });

    it('should search parts by part number', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          costSYP: 50000,
          sellingPriceSYP: 75000,
          quantity: 100,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const result = await partService.searchParts(mockTenantId, 'BRK-001');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches found', async () => {
      (prisma.part.findMany as jest.Mock).mockResolvedValue([]);

      const result = await partService.searchParts(mockTenantId, 'NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('updateQuantity', () => {
    it('should increase part quantity', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 100,
        minQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedPart = {
        ...mockPart,
        quantity: 150,
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockUpdatedPart);

      const result = await partService.updateQuantity(partId, mockTenantId, 50);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: partId, tenantId: mockTenantId },
      });
      expect(prisma.part.update).toHaveBeenCalledWith({
        where: { id: partId },
        data: { quantity: 150 },
      });
      expect(result.quantity).toBe(150);
    });

    it('should decrease part quantity', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 100,
        minQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedPart = {
        ...mockPart,
        quantity: 50,
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockUpdatedPart);

      const result = await partService.updateQuantity(partId, mockTenantId, -50);

      expect(result.quantity).toBe(50);
    });

    it('should throw error if part not found', async () => {
      const partId = 'non-existent-part';

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(partService.updateQuantity(partId, mockTenantId, 10)).rejects.toThrow(
        'Part not found'
      );
    });

    it('should throw error if insufficient quantity', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 10,
        minQuantity: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);

      await expect(partService.updateQuantity(partId, mockTenantId, -20)).rejects.toThrow(
        'Insufficient quantity'
      );
    });
  });

  describe('getLowStockParts', () => {
    it('should return parts with low stock', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          quantity: 5,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'part-2',
          tenantId: mockTenantId,
          partNumber: 'OIL-001',
          name: 'Engine Oil',
          quantity: 20,
          minQuantity: 15,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const result = await partService.getLowStockParts(mockTenantId);

      expect(prisma.part.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          isActive: true,
        },
        orderBy: [{ quantity: 'asc' }, { name: 'asc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBeLessThanOrEqual(result[0].minQuantity);
    });

    it('should return empty array when no low stock parts', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          quantity: 50,
          minQuantity: 10,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const result = await partService.getLowStockParts(mockTenantId);

      expect(result).toEqual([]);
    });

    it('should exclude inactive parts from low stock list', async () => {
      const mockParts = [
        {
          id: 'part-1',
          tenantId: mockTenantId,
          partNumber: 'BRK-001',
          name: 'Brake Pad',
          quantity: 5,
          minQuantity: 10,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.part.findMany as jest.Mock).mockResolvedValue(mockParts);

      const result = await partService.getLowStockParts(mockTenantId);

      expect(result).toEqual([]);
    });
  });
});
