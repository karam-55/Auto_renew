import { InventoryTransactionService } from '../../src/modules/inventory-transactions/service';
import { TransactionType } from '@prisma/client';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    part: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    inventoryTransaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('InventoryTransactionService', () => {
  let inventoryTransactionService: InventoryTransactionService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    inventoryTransactionService = new InventoryTransactionService();
    jest.clearAllMocks();
  });

  describe('createInventoryTransaction', () => {
    it('should create a purchase transaction', async () => {
      const transactionData = {
        partId: 'part-1',
        warehouseId: 'warehouse-1',
        transactionType: 'PURCHASE' as TransactionType,
        quantity: 100,
        unitCost: 50000,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'po-1',
        notes: 'Initial stock purchase',
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 50,
      };

      const mockWarehouse = {
        id: 'warehouse-1',
        tenantId: mockTenantId,
        name: 'Main Warehouse',
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: transactionData.partId,
        warehouseId: transactionData.warehouseId,
        type: transactionData.transactionType as TransactionType,
        quantity: transactionData.quantity,
        costSYP: transactionData.unitCost,
        reference: `${transactionData.referenceType}:${transactionData.referenceId}`,
        notes: transactionData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 150 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: transactionData.partId, tenantId: mockTenantId },
      });
      expect(prisma.warehouse.findFirst).toHaveBeenCalledWith({
        where: { id: transactionData.warehouseId, tenantId: mockTenantId },
      });
      expect(prisma.inventoryTransaction.create).toHaveBeenCalled();
      expect(result.transactionType).toBe('PURCHASE');
    });

    it('should create a consumption transaction', async () => {
      const transactionData = {
        partId: 'part-1',
        warehouseId: 'warehouse-1',
        transactionType: 'CONSUMPTION' as TransactionType,
        quantity: 5,
        unitCost: 50000,
        referenceType: 'BOOKING',
        referenceId: 'booking-1',
        notes: 'Used for brake replacement',
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 50,
      };

      const mockWarehouse = {
        id: 'warehouse-1',
        tenantId: mockTenantId,
        name: 'Main Warehouse',
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: transactionData.partId,
        warehouseId: transactionData.warehouseId,
        type: transactionData.transactionType as TransactionType,
        quantity: transactionData.quantity,
        costSYP: transactionData.unitCost,
        reference: `${transactionData.referenceType}:${transactionData.referenceId}`,
        notes: transactionData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 45 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.transactionType).toBe('CONSUMPTION');
    });

    it('should throw error if part not found', async () => {
      const transactionData = {
        partId: 'non-existent-part',
        transactionType: 'PURCHASE' as TransactionType,
        quantity: 100,
        unitCost: 50000,
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData)
      ).rejects.toThrow('Part not found');
    });

    it('should throw error if warehouse not found', async () => {
      const transactionData = {
        partId: 'part-1',
        warehouseId: 'non-existent-warehouse',
        transactionType: 'PURCHASE' as TransactionType,
        quantity: 100,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData)
      ).rejects.toThrow('Warehouse not found');
    });

    it('should create transaction without warehouse', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: 'PURCHASE' as TransactionType,
        quantity: 100,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
        quantity: 50,
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: transactionData.partId,
        warehouseId: null,
        type: transactionData.transactionType as TransactionType,
        quantity: transactionData.quantity,
        costSYP: transactionData.unitCost,
        reference: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 150 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.warehouseId).toBeNull();
    });
  });

  describe('getInventoryTransactions', () => {
    it('should return all inventory transactions for a tenant', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          warehouseId: 'warehouse-1',
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          reference: 'PURCHASE_ORDER:po-1',
          notes: 'Initial stock',
          createdAt: new Date(),
          updatedAt: new Date(),
          part: {
            id: 'part-1',
            partNumber: 'BRK-001',
            name: 'Brake Pad',
          },
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
          },
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId);

      expect(prisma.inventoryTransaction.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter transactions by part id', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: null,
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId, {
        partId: 'part-1',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter transactions by warehouse id', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          warehouseId: 'warehouse-1',
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId, {
        warehouseId: 'warehouse-1',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter transactions by transaction type', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          type: 'CONSUMPTION' as TransactionType,
          quantity: 5,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: null,
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId, {
        transactionType: 'CONSUMPTION' as TransactionType,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].transactionType).toBe('CONSUMPTION');
    });

    it('should filter transactions by date range', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: null,
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: null,
        },
      ];

      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(25);

      const result = await inventoryTransactionService.getInventoryTransactions(mockTenantId, {}, {
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getPartHistory', () => {
    it('should return part transaction history', async () => {
      const partId = 'part-1';
      const mockPart = {
        id: partId,
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId,
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: mockPart,
          warehouse: null,
        },
      ];

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getPartHistory(mockTenantId, partId);

      expect(prisma.part.findFirst).toHaveBeenCalledWith({
        where: { id: partId, tenantId: mockTenantId },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should throw error if part not found', async () => {
      const partId = 'non-existent-part';

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(inventoryTransactionService.getPartHistory(mockTenantId, partId)).rejects.toThrow(
        'Part not found'
      );
    });
  });

  describe('getWarehouseTransactions', () => {
    it('should return warehouse transaction history', async () => {
      const warehouseId = 'warehouse-1';
      const mockWarehouse = {
        id: warehouseId,
        tenantId: mockTenantId,
        name: 'Main Warehouse',
      };

      const mockTransactions = [
        {
          id: 'transaction-1',
          tenantId: mockTenantId,
          partId: 'part-1',
          warehouseId,
          type: 'PURCHASE' as TransactionType,
          quantity: 100,
          costSYP: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
          part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          warehouse: mockWarehouse,
        },
      ];

      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.inventoryTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);
      (prisma.inventoryTransaction.count as jest.Mock).mockResolvedValue(1);

      const result = await inventoryTransactionService.getWarehouseTransactions(mockTenantId, warehouseId);

      expect(prisma.warehouse.findFirst).toHaveBeenCalledWith({
        where: { id: warehouseId, tenantId: mockTenantId },
      });
      expect(result.data).toHaveLength(1);
    });

    it('should throw error if warehouse not found', async () => {
      const warehouseId = 'non-existent-warehouse';

      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        inventoryTransactionService.getWarehouseTransactions(mockTenantId, warehouseId)
      ).rejects.toThrow('Warehouse not found');
    });
  });

  describe('updateInventoryTransaction', () => {
    it('should update an existing transaction', async () => {
      const transactionId = 'transaction-1';
      const updateData = {
        quantity: 150,
        unitCost: 55000,
      };

      const mockExistingTransaction = {
        id: transactionId,
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.PURCHASE,
        quantity: 100,
        costSYP: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 200,
      };

      const mockUpdatedTransaction = {
        ...mockExistingTransaction,
        quantity: updateData.quantity,
        costSYP: updateData.unitCost,
      };

      (prisma.inventoryTransaction.findFirst as jest.Mock).mockResolvedValue(mockExistingTransaction);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.update as jest.Mock).mockResolvedValue(mockUpdatedTransaction);

      const result = await inventoryTransactionService.updateInventoryTransaction(
        transactionId,
        mockTenantId,
        updateData
      );

      expect(prisma.inventoryTransaction.findFirst).toHaveBeenCalledWith({
        where: { id: transactionId, tenantId: mockTenantId },
      });
      expect(prisma.inventoryTransaction.update).toHaveBeenCalled();
      expect(result.quantity).toBe(updateData.quantity);
    });

    it('should throw error if transaction not found', async () => {
      const transactionId = 'non-existent-transaction';
      const updateData = { quantity: 150 };

      (prisma.inventoryTransaction.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        inventoryTransactionService.updateInventoryTransaction(transactionId, mockTenantId, updateData)
      ).rejects.toThrow('Inventory transaction not found');
    });
  });

  describe('deleteInventoryTransaction', () => {
    it('should delete a transaction', async () => {
      const transactionId = 'transaction-1';
      const mockTransaction = {
        id: transactionId,
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.PURCHASE,
        quantity: 100,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 150,
      };

      (prisma.inventoryTransaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.delete as jest.Mock).mockResolvedValue(mockTransaction);

      await inventoryTransactionService.deleteInventoryTransaction(transactionId, mockTenantId);

      expect(prisma.inventoryTransaction.findFirst).toHaveBeenCalledWith({
        where: { id: transactionId, tenantId: mockTenantId },
      });
      expect(prisma.inventoryTransaction.delete).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
    });

    it('should throw error if transaction not found', async () => {
      const transactionId = 'non-existent-transaction';

      (prisma.inventoryTransaction.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        inventoryTransactionService.deleteInventoryTransaction(transactionId, mockTenantId)
      ).rejects.toThrow('Inventory transaction not found');
    });
  });

  describe('Transaction Type Logic', () => {
    it('should handle PURCHASE transaction type', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: 'PURCHASE' as TransactionType,
        quantity: 100,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 50,
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.PURCHASE,
        quantity: 100,
        costSYP: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 150 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.transactionType).toBe('PURCHASE');
    });

    it('should handle CONSUMPTION transaction type', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: 'CONSUMPTION' as TransactionType,
        quantity: 5,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 50,
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.CONSUMPTION,
        quantity: 5,
        costSYP: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 45 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.transactionType).toBe('CONSUMPTION');
    });

    it('should handle SALE transaction type', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: 'SALE' as TransactionType,
        quantity: 10,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 50,
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.SALE,
        quantity: 10,
        costSYP: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 40 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.transactionType).toBe('SALE');
    });

    it('should handle ADJUSTMENT transaction type', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: 'ADJUSTMENT' as TransactionType,
        quantity: 5,
        unitCost: 50000,
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        quantity: 50,
      };

      const mockTransaction = {
        id: 'transaction-1',
        tenantId: mockTenantId,
        partId: 'part-1',
        type: TransactionType.ADJUSTMENT,
        quantity: 5,
        costSYP: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.part.findUnique as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.part.update as jest.Mock).mockResolvedValue({ ...mockPart, quantity: 55 });

      const result = await inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData);

      expect(result.transactionType).toBe('ADJUSTMENT');
    });
  });
});
