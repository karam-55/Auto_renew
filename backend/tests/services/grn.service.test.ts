import { GRNService } from '../../src/modules/grn/service';
import { GRNStatus } from '../../src/modules/grn/types';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    supplier: {
      findFirst: jest.fn(),
    },
    purchaseOrder: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    goodsReceiptNote: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    goodsReceiptNoteLine: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    part: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    inventoryTransaction: {
      create: jest.fn(),
    },
  },
}));

describe('GRNService', () => {
  let grnService: GRNService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    grnService = new GRNService();
    jest.clearAllMocks();
  });

  describe('createGRN', () => {
    it('should create a new GRN', async () => {
      const grnData = {
        purchaseOrderId: 'po-1',
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        receivedDate: new Date('2024-01-20'),
        notes: 'Received in good condition',
        lines: [
          {
            partId: 'part-1',
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
          },
        ],
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        supplierId: 'supplier-1',
        status: 'APPROVED',
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      const mockWarehouse = {
        id: 'warehouse-1',
        tenantId: mockTenantId,
        name: 'Main Warehouse',
        code: 'MW-001',
      };

      const mockGRN = {
        id: 'grn-1',
        tenantId: mockTenantId,
        grnNumber: 'GRN-2024-00001',
        purchaseOrderId: grnData.purchaseOrderId,
        supplierId: grnData.supplierId,
        warehouseId: grnData.warehouseId,
        receivedDate: grnData.receivedDate,
        status: GRNStatus.DRAFT,
        receivedBy: 'user-1',
        notes: grnData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: mockSupplier,
        warehouse: mockWarehouse,
        purchaseOrder: mockPurchaseOrder,
        lines: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockPurchaseOrder);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.goodsReceiptNote.create as jest.Mock).mockResolvedValue(mockGRN);

      const result = await grnService.createGRN(mockTenantId, grnData);

      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: grnData.purchaseOrderId, tenantId: mockTenantId },
      });
      expect(prisma.goodsReceiptNote.create).toHaveBeenCalled();
      expect(result.status).toBe(GRNStatus.DRAFT);
    });

    it('should throw error if purchase order not found', async () => {
      const grnData = {
        purchaseOrderId: 'non-existent-po',
        supplierId: 'supplier-1',
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.createGRN(mockTenantId, grnData)).rejects.toThrow(
        'Purchase order not found'
      );
    });

    it('should throw error if supplier not found', async () => {
      const grnData = {
        purchaseOrderId: 'po-1',
        supplierId: 'non-existent-supplier',
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockPurchaseOrder);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.createGRN(mockTenantId, grnData)).rejects.toThrow('Supplier not found');
    });

    it('should throw error if warehouse not found', async () => {
      const grnData = {
        purchaseOrderId: 'po-1',
        supplierId: 'supplier-1',
        warehouseId: 'non-existent-warehouse',
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockPurchaseOrder);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.warehouse.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.createGRN(mockTenantId, grnData)).rejects.toThrow('Warehouse not found');
    });
  });

  describe('addGRNLine', () => {
    it('should add a line item to GRN', async () => {
      const grnId = 'grn-1';
      const lineData = {
        partId: 'part-1',
        orderedQuantity: 100,
        receivedQuantity: 100,
        damagedQuantity: 0,
        unitCost: 50000,
      };

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        status: GRNStatus.DRAFT,
        lines: [],
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      const mockLine = {
        id: 'grn-line-1',
        grnId,
        partId: 'part-1',
        orderedQuantity: 100,
        receivedQuantity: 100,
        damagedQuantity: 0,
        unitCost: 50000,
        totalCost: 5000000,
        createdAt: new Date(),
        part: mockPart,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.goodsReceiptNoteLine.create as jest.Mock).mockResolvedValue(mockLine);

      const result = await grnService.addGRNLine(grnId, mockTenantId, lineData);

      expect(prisma.goodsReceiptNoteLine.create).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should throw error if GRN not found', async () => {
      const grnId = 'non-existent-grn';
      const lineData = {
        partId: 'part-1',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unitCost: 50000,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.addGRNLine(grnId, mockTenantId, lineData)).rejects.toThrow(
        'Goods Receipt Note not found'
      );
    });

    it('should throw error if GRN is not in draft status', async () => {
      const grnId = 'grn-1';
      const lineData = {
        partId: 'part-1',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unitCost: 50000,
      };

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        status: GRNStatus.COMPLETED,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);

      await expect(grnService.addGRNLine(grnId, mockTenantId, lineData)).rejects.toThrow(
        'Cannot add lines to completed or cancelled GRN'
      );
    });

    it('should throw error if part not found', async () => {
      const grnId = 'grn-1';
      const lineData = {
        partId: 'non-existent-part',
        orderedQuantity: 100,
        receivedQuantity: 100,
        unitCost: 50000,
      };

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        status: GRNStatus.DRAFT,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.addGRNLine(grnId, mockTenantId, lineData)).rejects.toThrow('Part not found');
    });
  });

  describe('updateGRNLine', () => {
    it('should update a GRN line item', async () => {
      const lineId = 'grn-line-1';
      const updateData = {
        receivedQuantity: 95,
        damagedQuantity: 5,
      };

      const mockLine = {
        id: lineId,
        grnId: 'grn-1',
        partId: 'part-1',
        orderedQuantity: 100,
        receivedQuantity: 100,
        damagedQuantity: 0,
        unitCost: 50000,
        totalCost: 5000000,
        goodsReceiptNote: {
          id: 'grn-1',
          tenantId: mockTenantId,
          status: GRNStatus.DRAFT,
        },
      };

      const mockUpdatedLine = {
        ...mockLine,
        receivedQuantity: updateData.receivedQuantity,
        damagedQuantity: updateData.damagedQuantity,
      };

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(mockLine);
      (prisma.goodsReceiptNoteLine.update as jest.Mock).mockResolvedValue(mockUpdatedLine);

      const result = await grnService.updateGRNLine(lineId, mockTenantId, updateData);

      expect(prisma.goodsReceiptNoteLine.update).toHaveBeenCalled();
      expect(result.receivedQuantity).toBe(updateData.receivedQuantity);
    });

    it('should throw error if line item not found', async () => {
      const lineId = 'non-existent-line';
      const updateData = { receivedQuantity: 95 };

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.updateGRNLine(lineId, mockTenantId, updateData)).rejects.toThrow(
        'Line item not found'
      );
    });

    it('should throw error if GRN is not in draft status', async () => {
      const lineId = 'grn-line-1';
      const updateData = { receivedQuantity: 95 };

      const mockLine = {
        id: lineId,
        goodsReceiptNote: {
          id: 'grn-1',
          tenantId: mockTenantId,
          status: GRNStatus.COMPLETED,
        },
      };

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(mockLine);

      await expect(grnService.updateGRNLine(lineId, mockTenantId, updateData)).rejects.toThrow(
        'Cannot modify lines in completed or cancelled GRN'
      );
    });
  });

  describe('removeGRNLine', () => {
    it('should remove a GRN line item', async () => {
      const lineId = 'grn-line-1';

      const mockLine = {
        id: lineId,
        grnId: 'grn-1',
        goodsReceiptNote: {
          id: 'grn-1',
          tenantId: mockTenantId,
          status: GRNStatus.DRAFT,
        },
      };

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(mockLine);
      (prisma.goodsReceiptNoteLine.delete as jest.Mock).mockResolvedValue(mockLine);

      await grnService.removeGRNLine(lineId, mockTenantId);

      expect(prisma.goodsReceiptNoteLine.delete).toHaveBeenCalledWith({
        where: { id: lineId },
      });
    });

    it('should throw error if line item not found', async () => {
      const lineId = 'non-existent-line';

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.removeGRNLine(lineId, mockTenantId)).rejects.toThrow(
        'Line item not found'
      );
    });

    it('should throw error if GRN is not in draft status', async () => {
      const lineId = 'grn-line-1';

      const mockLine = {
        id: lineId,
        goodsReceiptNote: {
          id: 'grn-1',
          tenantId: mockTenantId,
          status: GRNStatus.COMPLETED,
        },
      };

      (prisma.goodsReceiptNoteLine.findFirst as jest.Mock).mockResolvedValue(mockLine);

      await expect(grnService.removeGRNLine(lineId, mockTenantId)).rejects.toThrow(
        'Cannot remove lines from completed or cancelled GRN'
      );
    });
  });

  describe('completeGRN', () => {
    it('should complete a GRN and create inventory transactions', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        grnNumber: 'GRN-2024-00001',
        purchaseOrderId: 'po-1',
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        receivedDate: new Date(),
        status: GRNStatus.DRAFT,
        receivedBy: userId,
        notes: 'Received in good condition',
        lines: [
          {
            id: 'grn-line-1',
            partId: 'part-1',
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
            totalCost: 5000000,
            part: {
              id: 'part-1',
              partNumber: 'BRK-001',
              name: 'Brake Pad',
              quantity: 50,
            },
          },
        ],
      };

      const mockUpdatedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      const mockPart = {
        id: 'part-1',
        quantity: 150,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.goodsReceiptNote.update as jest.Mock).mockResolvedValue(mockUpdatedGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockGRN.lines[0].part);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});

      const result = await grnService.completeGRN(grnId, mockTenantId, userId);

      expect(prisma.goodsReceiptNote.update).toHaveBeenCalledWith({
        where: { id: grnId },
        data: { status: GRNStatus.COMPLETED },
      });
      expect(prisma.inventoryTransaction.create).toHaveBeenCalled();
      expect(prisma.part.update).toHaveBeenCalled();
      expect(result.status).toBe(GRNStatus.COMPLETED);
    });

    it('should throw error if GRN not found', async () => {
      const grnId = 'non-existent-grn';
      const userId = 'user-1';

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(grnService.completeGRN(grnId, mockTenantId, userId)).rejects.toThrow(
        'Goods Receipt Note not found'
      );
    });

    it('should throw error if GRN is not in draft status', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        status: GRNStatus.COMPLETED,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);

      await expect(grnService.completeGRN(grnId, mockTenantId, userId)).rejects.toThrow(
        'Only draft GRNs can be completed'
      );
    });

    it('should throw error if GRN has no lines', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        status: GRNStatus.DRAFT,
        lines: [],
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);

      await expect(grnService.completeGRN(grnId, mockTenantId, userId)).rejects.toThrow(
        'Cannot complete GRN without lines'
      );
    });
  });

  describe('Inventory Transaction Creation on Completion', () => {
    it('should create inventory transaction for each line item', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        purchaseOrderId: 'po-1',
        warehouseId: 'warehouse-1',
        status: GRNStatus.DRAFT,
        lines: [
          {
            id: 'grn-line-1',
            partId: 'part-1',
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
            totalCost: 5000000,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad', quantity: 50 },
          },
          {
            id: 'grn-line-2',
            partId: 'part-2',
            receivedQuantity: 50,
            damagedQuantity: 0,
            unitCost: 30000,
            totalCost: 1500000,
            part: { id: 'part-2', partNumber: 'OIL-001', name: 'Engine Oil', quantity: 20 },
          },
        ],
      };

      const mockUpdatedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.goodsReceiptNote.update as jest.Mock).mockResolvedValue(mockUpdatedGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockGRN.lines[0].part);
      (prisma.part.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});

      await grnService.completeGRN(grnId, mockTenantId, userId);

      expect(prisma.inventoryTransaction.create).toHaveBeenCalledTimes(2);
    });

    it('should handle damaged items correctly', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        purchaseOrderId: 'po-1',
        warehouseId: 'warehouse-1',
        status: GRNStatus.DRAFT,
        lines: [
          {
            id: 'grn-line-1',
            partId: 'part-1',
            receivedQuantity: 95,
            damagedQuantity: 5,
            unitCost: 50000,
            totalCost: 5000000,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad', quantity: 50 },
          },
        ],
      };

      const mockUpdatedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.goodsReceiptNote.update as jest.Mock).mockResolvedValue(mockUpdatedGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockGRN.lines[0].part);
      (prisma.part.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});

      await grnService.completeGRN(grnId, mockTenantId, userId);

      // Should only add the received quantity (95), not the damaged quantity (5)
      expect(prisma.part.update).toHaveBeenCalledWith({
        where: { id: 'part-1' },
        data: { quantity: { increment: 95 } },
      });
    });
  });

  describe('Part Quantity Update on Completion', () => {
    it('should update part quantity when GRN is completed', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        purchaseOrderId: 'po-1',
        warehouseId: 'warehouse-1',
        status: GRNStatus.DRAFT,
        lines: [
          {
            id: 'grn-line-1',
            partId: 'part-1',
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
            totalCost: 5000000,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad', quantity: 50 },
          },
        ],
      };

      const mockUpdatedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      const mockUpdatedPart = {
        id: 'part-1',
        quantity: 150,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.goodsReceiptNote.update as jest.Mock).mockResolvedValue(mockUpdatedGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockGRN.lines[0].part);
      (prisma.part.update as jest.Mock).mockResolvedValue(mockUpdatedPart);
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});

      await grnService.completeGRN(grnId, mockTenantId, userId);

      expect(prisma.part.update).toHaveBeenCalledWith({
        where: { id: 'part-1' },
        data: { quantity: { increment: 100 } },
      });
    });
  });

  describe('Purchase Order Status Update', () => {
    it('should update purchase order status when GRN is completed', async () => {
      const grnId = 'grn-1';
      const userId = 'user-1';

      const mockGRN = {
        id: grnId,
        tenantId: mockTenantId,
        purchaseOrderId: 'po-1',
        warehouseId: 'warehouse-1',
        status: GRNStatus.DRAFT,
        lines: [
          {
            id: 'grn-line-1',
            partId: 'part-1',
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
            totalCost: 5000000,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad', quantity: 50 },
          },
        ],
      };

      const mockUpdatedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);
      (prisma.goodsReceiptNote.update as jest.Mock).mockResolvedValue(mockUpdatedGRN);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockGRN.lines[0].part);
      (prisma.part.update as jest.Mock).mockResolvedValue({});
      (prisma.inventoryTransaction.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});

      await grnService.completeGRN(grnId, mockTenantId, userId);

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'RECEIVED' },
      });
    });
  });

  describe('getGRNs', () => {
    it('should return all GRNs for a tenant', async () => {
      const mockGRNs = [
        {
          id: 'grn-1',
          tenantId: mockTenantId,
          grnNumber: 'GRN-2024-00001',
          purchaseOrderId: 'po-1',
          supplierId: 'supplier-1',
          receivedDate: new Date(),
          status: GRNStatus.COMPLETED,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          warehouse: { id: 'warehouse-1', name: 'Main Warehouse', code: 'MW-001' },
          purchaseOrder: { id: 'po-1', orderNumber: 'PO-2024-00001', status: 'RECEIVED' },
          lines: [],
        },
      ];

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue(mockGRNs);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(1);

      const result = await grnService.getGRNs(mockTenantId);

      expect(prisma.goodsReceiptNote.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter GRNs by supplier', async () => {
      const mockGRNs = [
        {
          id: 'grn-1',
          tenantId: mockTenantId,
          supplierId: 'supplier-1',
          status: GRNStatus.COMPLETED,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          lines: [],
        },
      ];

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue(mockGRNs);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(1);

      const result = await grnService.getGRNs(mockTenantId, { supplierId: 'supplier-1' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter GRNs by status', async () => {
      const mockGRNs = [
        {
          id: 'grn-1',
          tenantId: mockTenantId,
          status: GRNStatus.COMPLETED,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          lines: [],
        },
      ];

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue(mockGRNs);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(1);

      const result = await grnService.getGRNs(mockTenantId, { status: GRNStatus.COMPLETED });

      expect(result.data).toHaveLength(1);
    });

    it('should filter GRNs by purchase order', async () => {
      const mockGRNs = [
        {
          id: 'grn-1',
          tenantId: mockTenantId,
          purchaseOrderId: 'po-1',
          status: GRNStatus.COMPLETED,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          lines: [],
        },
      ];

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue(mockGRNs);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(1);

      const result = await grnService.getGRNs(mockTenantId, { purchaseOrderId: 'po-1' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getGRNById', () => {
    it('should return GRN by id', async () => {
      const mockGRN = {
        id: 'grn-1',
        tenantId: mockTenantId,
        grnNumber: 'GRN-2024-00001',
        status: GRNStatus.COMPLETED,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        lines: [],
      };

      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(mockGRN);

      const result = await grnService.getGRNById('grn-1', mockTenantId);

      expect(prisma.goodsReceiptNote.findFirst).toHaveBeenCalledWith({
        where: { id: 'grn-1', tenantId: mockTenantId },
        include: expect.any(Object),
      });
      expect(result).toBeTruthy();
    });

    it('should return null when GRN not found', async () => {
      (prisma.goodsReceiptNote.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await grnService.getGRNById('non-existent', mockTenantId);

      expect(result).toBeNull();
    });
  });
});
