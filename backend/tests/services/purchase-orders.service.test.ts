import { PurchaseOrderService } from '../../src/modules/purchase-orders/service';
import { OrderStatus } from '@prisma/client';
import prisma from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    supplier: {
      findFirst: jest.fn(),
    },
    purchaseOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrderItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    part: {
      findFirst: jest.fn(),
    },
    goodsReceiptNote: {
      count: jest.fn(),
    },
  },
}));

describe('PurchaseOrderService', () => {
  let purchaseOrderService: PurchaseOrderService;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    purchaseOrderService = new PurchaseOrderService();
    jest.clearAllMocks();
  });

  describe('createPurchaseOrder', () => {
    it('should create a new purchase order', async () => {
      const orderData = {
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15'),
        notes: 'Urgent order for brake parts',
        items: [
          {
            partId: 'part-1',
            quantity: 100,
            unitCost: 50000,
          },
          {
            partId: 'part-2',
            quantity: 50,
            unitCost: 30000,
          },
        ],
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
        phone: '+971501234567',
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        supplierId: orderData.supplierId,
        orderNumber: 'PO-2024-00001',
        orderDate: orderData.orderDate,
        totalSYP: 8800000, // (100*50000 + 50*30000) * 1.1
        totalUSD: null,
        status: 'PENDING' as OrderStatus,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: mockSupplier,
        items: [
          {
            id: 'poi-1',
            purchaseOrderId: 'po-1',
            partId: 'part-1',
            quantity: 100,
            costSYP: 50000,
            totalSYP: 5000000,
            receivedQty: 0,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          },
          {
            id: 'poi-2',
            purchaseOrderId: 'po-1',
            partId: 'part-2',
            quantity: 50,
            costSYP: 30000,
            totalSYP: 1500000,
            receivedQty: 0,
            part: { id: 'part-2', partNumber: 'OIL-001', name: 'Engine Oil' },
          },
        ],
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockPurchaseOrder);

      const result = await purchaseOrderService.createPurchaseOrder(mockTenantId, orderData);

      expect(prisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: orderData.supplierId, tenantId: mockTenantId },
      });
      expect(prisma.purchaseOrder.create).toHaveBeenCalled();
      expect(result.orderNumber).toBe('PO-2024-00001');
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.items).toHaveLength(2);
    });

    it('should throw error if supplier not found', async () => {
      const orderData = {
        supplierId: 'non-existent-supplier',
        items: [
          {
            partId: 'part-1',
            quantity: 100,
            unitCost: 50000,
          },
        ],
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(purchaseOrderService.createPurchaseOrder(mockTenantId, orderData)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should create purchase order without items', async () => {
      const orderData = {
        supplierId: 'supplier-1',
        notes: 'Draft order',
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        supplierId: orderData.supplierId,
        orderNumber: 'PO-2024-00001',
        orderDate: new Date(),
        totalSYP: 0,
        totalUSD: null,
        status: 'PENDING' as OrderStatus,
        notes: orderData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: mockSupplier,
        items: [],
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockPurchaseOrder);

      const result = await purchaseOrderService.createPurchaseOrder(mockTenantId, orderData);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getPurchaseOrders', () => {
    it('should return all purchase orders for a tenant', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date(),
          totalSYP: 8800000,
          totalUSD: null,
          status: 'PENDING' as OrderStatus,
          notes: 'Urgent order',
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: {
            id: 'supplier-1',
            name: 'Auto Parts Supplier',
            phone: '+971501234567',
          },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId);

      expect(prisma.purchaseOrder.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter purchase orders by supplier', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date(),
          totalSYP: 8800000,
          status: 'PENDING' as OrderStatus,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId, {
        supplierId: 'supplier-1',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter purchase orders by status', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date(),
          totalSYP: 8800000,
          status: 'APPROVED' as OrderStatus,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId, {
        status: 'APPROVED' as OrderStatus,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(OrderStatus.APPROVED);
    });

    it('should filter purchase orders by date range', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date('2024-01-15'),
          totalSYP: 8800000,
          status: 'PENDING' as OrderStatus,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId, {
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
      });

      expect(result.data).toHaveLength(1);
    });

    it('should search purchase orders by order number or supplier name', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date(),
          totalSYP: 8800000,
          status: 'PENDING' as OrderStatus,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId, {
        search: 'PO-2024-00001',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const mockPurchaseOrders = [
        {
          id: 'po-1',
          tenantId: mockTenantId,
          orderNumber: 'PO-2024-00001',
          supplierId: 'supplier-1',
          orderDate: new Date(),
          totalSYP: 8800000,
          status: 'PENDING' as OrderStatus,
          supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
          items: [],
        },
      ];

      (prisma.purchaseOrder.findMany as jest.Mock).mockResolvedValue(mockPurchaseOrders);
      (prisma.purchaseOrder.count as jest.Mock).mockResolvedValue(25);

      const result = await purchaseOrderService.getPurchaseOrders(mockTenantId, {}, {
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getPurchaseOrderById', () => {
    it('should return purchase order by id', async () => {
      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        supplierId: 'supplier-1',
        orderDate: new Date(),
        totalSYP: 8800000,
        status: 'PENDING' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockPurchaseOrder);

      const result = await purchaseOrderService.getPurchaseOrderById('po-1', mockTenantId);

      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: 'po-1', tenantId: mockTenantId },
        include: expect.any(Object),
      });
      expect(result).toBeTruthy();
    });

    it('should return null when purchase order not found', async () => {
      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await purchaseOrderService.getPurchaseOrderById('non-existent', mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe('updatePurchaseOrder', () => {
    it('should update an existing purchase order', async () => {
      const orderId = 'po-1';
      const updateData = {
        orderDate: new Date('2024-02-01'),
        notes: 'Updated notes',
      };

      const mockExistingOrder = {
        id: orderId,
        tenantId: mockTenantId,
        supplierId: 'supplier-1',
        orderNumber: 'PO-2024-00001',
        orderDate: new Date('2024-01-15'),
        totalSYP: 8800000,
        status: 'PENDING' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [],
      };

      const mockUpdatedOrder = {
        ...mockExistingOrder,
        orderDate: updateData.orderDate,
        notes: updateData.notes,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.updatePurchaseOrder(orderId, mockTenantId, updateData);

      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, tenantId: mockTenantId },
      });
      expect(prisma.purchaseOrder.update).toHaveBeenCalled();
      expect(result.orderDate).toBe(updateData.orderDate);
    });

    it('should throw error if purchase order not found', async () => {
      const orderId = 'non-existent-po';
      const updateData = { notes: 'Updated notes' };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.updatePurchaseOrder(orderId, mockTenantId, updateData)
      ).rejects.toThrow('Purchase order not found');
    });

    it('should throw error if new supplier not found', async () => {
      const orderId = 'po-1';
      const updateData = {
        supplierId: 'non-existent-supplier',
      };

      const mockExistingOrder = {
        id: orderId,
        tenantId: mockTenantId,
        supplierId: 'supplier-1',
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockExistingOrder);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.updatePurchaseOrder(orderId, mockTenantId, updateData)
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('deletePurchaseOrder', () => {
    it('should delete a pending purchase order', async () => {
      const orderId = 'po-1';
      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        supplierId: 'supplier-1',
        orderNumber: 'PO-2024-00001',
        status: 'PENDING' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(0);
      (prisma.purchaseOrder.delete as jest.Mock).mockResolvedValue(mockOrder);

      await purchaseOrderService.deletePurchaseOrder(orderId, mockTenantId);

      expect(prisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, tenantId: mockTenantId },
      });
      expect(prisma.goodsReceiptNote.count).toHaveBeenCalledWith({
        where: { purchaseOrderId: orderId },
      });
      expect(prisma.purchaseOrder.delete).toHaveBeenCalledWith({
        where: { id: orderId },
      });
    });

    it('should throw error if purchase order not found', async () => {
      const orderId = 'non-existent-po';

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(purchaseOrderService.deletePurchaseOrder(orderId, mockTenantId)).rejects.toThrow(
        'Purchase order not found'
      );
    });

    it('should throw error if purchase order is approved', async () => {
      const orderId = 'po-1';
      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'APPROVED' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(purchaseOrderService.deletePurchaseOrder(orderId, mockTenantId)).rejects.toThrow(
        'Cannot delete approved or received purchase orders'
      );
    });

    it('should throw error if purchase order has GRNs', async () => {
      const orderId = 'po-1';
      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(2);

      await expect(purchaseOrderService.deletePurchaseOrder(orderId, mockTenantId)).rejects.toThrow(
        'Cannot delete purchase order with existing goods receipt notes'
      );
    });
  });

  describe('addPurchaseOrderLine', () => {
    it('should add a line item to purchase order', async () => {
      const orderId = 'po-1';
      const lineData = {
        partId: 'part-1',
        quantity: 100,
        unitCost: 50000,
      };

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
        items: [],
      };

      const mockPart = {
        id: 'part-1',
        tenantId: mockTenantId,
        partNumber: 'BRK-001',
        name: 'Brake Pad',
      };

      const mockUpdatedOrder = {
        id: orderId,
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        status: 'PENDING' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [
          {
            id: 'poi-1',
            purchaseOrderId: orderId,
            partId: 'part-1',
            quantity: 100,
            unitCost: 50000,
            totalCost: 5000000,
            receivedQuantity: 0,
            part: mockPart,
          },
        ],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(mockPart);
      (prisma.purchaseOrderItem.create as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrderItem.findMany as jest.Mock).mockResolvedValue([
        { totalSYP: 5000000 },
      ]);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.addPurchaseOrderLine(orderId, mockTenantId, lineData);

      expect(prisma.purchaseOrderItem.create).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it('should throw error if purchase order not found', async () => {
      const orderId = 'non-existent-po';
      const lineData = {
        partId: 'part-1',
        quantity: 100,
        unitCost: 50000,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.addPurchaseOrderLine(orderId, mockTenantId, lineData)
      ).rejects.toThrow('Purchase order not found');
    });

    it('should throw error if purchase order is approved', async () => {
      const orderId = 'po-1';
      const lineData = {
        partId: 'part-1',
        quantity: 100,
        unitCost: 50000,
      };

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'APPROVED' as OrderStatus,
        items: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        purchaseOrderService.addPurchaseOrderLine(orderId, mockTenantId, lineData)
      ).rejects.toThrow('Cannot add items to approved, received, or cancelled purchase orders');
    });

    it('should throw error if part not found', async () => {
      const orderId = 'po-1';
      const lineData = {
        partId: 'non-existent-part',
        quantity: 100,
        unitCost: 50000,
      };

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
        items: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.part.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.addPurchaseOrderLine(orderId, mockTenantId, lineData)
      ).rejects.toThrow('Part not found');
    });
  });

  describe('updatePurchaseOrderLine', () => {
    it('should update a line item', async () => {
      const lineId = 'poi-1';
      const updateData = {
        quantity: 150,
        unitCost: 55000,
      };

      const mockLineItem = {
        id: lineId,
        purchaseOrderId: 'po-1',
        partId: 'part-1',
        quantity: 100,
        costSYP: 50000,
        totalSYP: 5000000,
        purchaseOrder: {
          id: 'po-1',
          tenantId: mockTenantId,
          status: 'PENDING' as OrderStatus,
        },
      };

      const mockUpdatedOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        status: 'PENDING' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [
          {
            id: lineId,
            purchaseOrderId: 'po-1',
            partId: 'part-1',
            quantity: 150,
            unitCost: 55000,
            totalCost: 8250000,
            receivedQuantity: 0,
          },
        ],
      };

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(mockLineItem);
      (prisma.purchaseOrderItem.update as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrderItem.findMany as jest.Mock).mockResolvedValue([
        { totalSYP: 8250000 },
      ]);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.updatePurchaseOrderLine(lineId, mockTenantId, updateData);

      expect(prisma.purchaseOrderItem.update).toHaveBeenCalled();
      expect(result.items?.[0].quantity).toBe(150);
    });

    it('should throw error if line item not found', async () => {
      const lineId = 'non-existent-poi';
      const updateData = { quantity: 150 };

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.updatePurchaseOrderLine(lineId, mockTenantId, updateData)
      ).rejects.toThrow('Line item not found');
    });

    it('should throw error if purchase order is approved', async () => {
      const lineId = 'poi-1';
      const updateData = { quantity: 150 };

      const mockLineItem = {
        id: lineId,
        purchaseOrderId: 'po-1',
        purchaseOrder: {
          id: 'po-1',
          tenantId: mockTenantId,
          status: 'APPROVED' as OrderStatus,
        },
      };

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(mockLineItem);

      await expect(
        purchaseOrderService.updatePurchaseOrderLine(lineId, mockTenantId, updateData)
      ).rejects.toThrow('Cannot modify items in approved, received, or cancelled purchase orders');
    });
  });

  describe('removePurchaseOrderLine', () => {
    it('should remove a line item', async () => {
      const lineId = 'poi-1';

      const mockLineItem = {
        id: lineId,
        purchaseOrderId: 'po-1',
        purchaseOrder: {
          id: 'po-1',
          tenantId: mockTenantId,
          status: 'PENDING' as OrderStatus,
        },
      };

      const mockUpdatedOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        status: 'PENDING' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [],
      };

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(mockLineItem);
      (prisma.purchaseOrderItem.delete as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrderItem.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue({});
      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.removePurchaseOrderLine(lineId, mockTenantId);

      expect(prisma.purchaseOrderItem.delete).toHaveBeenCalledWith({
        where: { id: lineId },
      });
      expect(result.items).toHaveLength(0);
    });

    it('should throw error if line item not found', async () => {
      const lineId = 'non-existent-poi';

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(purchaseOrderService.removePurchaseOrderLine(lineId, mockTenantId)).rejects.toThrow(
        'Line item not found'
      );
    });

    it('should throw error if purchase order is approved', async () => {
      const lineId = 'poi-1';

      const mockLineItem = {
        id: lineId,
        purchaseOrderId: 'po-1',
        purchaseOrder: {
          id: 'po-1',
          tenantId: mockTenantId,
          status: 'APPROVED' as OrderStatus,
        },
      };

      (prisma.purchaseOrderItem.findFirst as jest.Mock).mockResolvedValue(mockLineItem);

      await expect(purchaseOrderService.removePurchaseOrderLine(lineId, mockTenantId)).rejects.toThrow(
        'Cannot remove items from approved, received, or cancelled purchase orders'
      );
    });
  });

  describe('approvePurchaseOrder', () => {
    it('should approve a pending purchase order', async () => {
      const orderId = 'po-1';
      const userId = 'user-1';

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
      };

      const mockUpdatedOrder = {
        id: orderId,
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        status: 'APPROVED' as OrderStatus,
        approvedBy: userId,
        approvedAt: new Date(),
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(2);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.approvePurchaseOrder(orderId, mockTenantId, userId);

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe(OrderStatus.APPROVED);
      expect(result.approvedBy).toBe(userId);
    });

    it('should throw error if purchase order not found', async () => {
      const orderId = 'non-existent-po';
      const userId = 'user-1';

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        purchaseOrderService.approvePurchaseOrder(orderId, mockTenantId, userId)
      ).rejects.toThrow('Purchase order not found');
    });

    it('should throw error if purchase order is not pending', async () => {
      const orderId = 'po-1';
      const userId = 'user-1';

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'APPROVED' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        purchaseOrderService.approvePurchaseOrder(orderId, mockTenantId, userId)
      ).rejects.toThrow('Purchase order can only be approved from PENDING status');
    });

    it('should throw error if purchase order has no items', async () => {
      const orderId = 'po-1';
      const userId = 'user-1';

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.purchaseOrderItem.count as jest.Mock).mockResolvedValue(0);

      await expect(
        purchaseOrderService.approvePurchaseOrder(orderId, mockTenantId, userId)
      ).rejects.toThrow('Cannot approve purchase order without items');
    });
  });

  describe('cancelPurchaseOrder', () => {
    it('should cancel a pending purchase order', async () => {
      const orderId = 'po-1';

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'PENDING' as OrderStatus,
      };

      const mockUpdatedOrder = {
        id: orderId,
        tenantId: mockTenantId,
        orderNumber: 'PO-2024-00001',
        status: 'CANCELLED' as OrderStatus,
        supplier: { id: 'supplier-1', name: 'Auto Parts Supplier', phone: '+971501234567' },
        items: [],
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.purchaseOrder.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await purchaseOrderService.cancelPurchaseOrder(orderId, mockTenantId);

      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: expect.any(Object),
      });
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error if purchase order is received', async () => {
      const orderId = 'po-1';

      const mockOrder = {
        id: orderId,
        tenantId: mockTenantId,
        status: 'RECEIVED' as OrderStatus,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await expect(purchaseOrderService.cancelPurchaseOrder(orderId, mockTenantId)).rejects.toThrow(
        'Cannot cancel received purchase orders'
      );
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate first order number for year', async () => {
      const year = new Date().getFullYear();

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await purchaseOrderService.generateOrderNumber(mockTenantId);

      expect(result).toBe(`PO-${year}-00001`);
    });

    it('should generate sequential order number', async () => {
      const year = new Date().getFullYear();

      const mockLastOrder = {
        orderNumber: `PO-${year}-00005`,
      };

      (prisma.purchaseOrder.findFirst as jest.Mock).mockResolvedValue(mockLastOrder);

      const result = await purchaseOrderService.generateOrderNumber(mockTenantId);

      expect(result).toBe(`PO-${year}-00006`);
    });
  });

  describe('Auto-calculation of totals', () => {
    it('should auto-calculate subtotal, tax, and total', async () => {
      const orderData = {
        supplierId: 'supplier-1',
        items: [
          {
            partId: 'part-1',
            quantity: 10,
            unitCost: 1000,
          },
          {
            partId: 'part-2',
            quantity: 5,
            unitCost: 2000,
          },
        ],
      };

      const mockSupplier = {
        id: 'supplier-1',
        tenantId: mockTenantId,
        name: 'Auto Parts Supplier',
      };

      const mockPurchaseOrder = {
        id: 'po-1',
        tenantId: mockTenantId,
        supplierId: orderData.supplierId,
        orderNumber: 'PO-2024-00001',
        totalSYP: 22000, // (10*1000 + 5*2000) * 1.1
        supplier: mockSupplier,
        items: [
          {
            id: 'poi-1',
            quantity: 10,
            costSYP: 1000,
            totalSYP: 10000,
            part: { id: 'part-1', partNumber: 'BRK-001', name: 'Brake Pad' },
          },
          {
            id: 'poi-2',
            quantity: 5,
            costSYP: 2000,
            totalSYP: 10000,
            part: { id: 'part-2', partNumber: 'OIL-001', name: 'Engine Oil' },
          },
        ],
      };

      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.purchaseOrder.create as jest.Mock).mockResolvedValue(mockPurchaseOrder);

      const result = await purchaseOrderService.createPurchaseOrder(mockTenantId, orderData);

      expect(result.subtotal).toBe(20000); // 10*1000 + 5*2000
      expect(result.tax).toBe(2000); // 10% of 20000
      expect(result.total).toBe(22000); // 20000 + 2000
    });
  });
});
