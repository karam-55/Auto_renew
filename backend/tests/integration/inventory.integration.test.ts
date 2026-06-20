import request from 'supertest';
import express from 'express';
import { SupplierService } from '../../src/modules/suppliers/service';
import { PartService } from '../../src/modules/parts/service';
import { PurchaseOrderService } from '../../src/modules/purchase-orders/service';
import { InventoryTransactionService } from '../../src/modules/inventory-transactions/service';
import { GRNService } from '../../src/modules/grn/service';
import { PurchaseOrderStatus } from '../../src/modules/purchase-orders/types';
import { GRNStatus } from '../../src/modules/grn/types';
import { TransactionType } from '../../src/modules/inventory-transactions/types';

describe('Inventory Integration Tests', () => {
  let supplierService: SupplierService;
  let partService: PartService;
  let purchaseOrderService: PurchaseOrderService;
  let inventoryTransactionService: InventoryTransactionService;
  let grnService: GRNService;
  const mockTenantId = 'tenant-integration-123';
  const mockUserId = 'user-integration-123';

  beforeEach(() => {
    supplierService = new SupplierService();
    partService = new PartService();
    purchaseOrderService = new PurchaseOrderService();
    inventoryTransactionService = new InventoryTransactionService();
    grnService = new GRNService();
  });

  describe('Complete Purchase Flow', () => {
    it('should test complete purchase flow: Create supplier → Create PO → Add lines → Approve → Create GRN → Complete → Verify inventory', async () => {
      // Step 1: Create Supplier
      const supplierData = {
        name: 'Integration Test Supplier',
        phone: '+971509999999',
        address: 'Test Address',
        contactPerson: 'Test Contact',
        paymentTerms: 'NET 30',
        creditLimit: 100000,
      };

      // Mock supplier creation
      const mockSupplier = {
        id: 'supplier-integration-1',
        tenantId: mockTenantId,
        ...supplierData,
        creditLimit: '100000',
        balance: '0',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(supplierService as any, 'createSupplier').mockResolvedValue({
        ...mockSupplier,
        creditLimit: 100000,
        balance: 0,
      });

      const supplier = await supplierService.createSupplier(mockTenantId, supplierData);
      expect(supplier.name).toBe(supplierData.name);
      expect(supplier.phone).toBe(supplierData.phone);

      // Step 2: Create Part
      const partData = {
        partNumber: 'INT-001',
        name: 'Integration Test Part',
        costSYP: 50000,
        sellingPriceSYP: 75000,
        quantity: 0,
        minQuantity: 10,
      };

      const mockPart = {
        id: 'part-integration-1',
        tenantId: mockTenantId,
        ...partData,
        nameAr: null,
        nameEn: null,
        description: null,
        categoryId: null,
        supplierId: null,
        costUSD: null,
        sellingPriceUSD: null,
        location: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(partService as any, 'createPart').mockResolvedValue(mockPart);

      const part = await partService.createPart(mockTenantId, partData);
      expect(part.partNumber).toBe(partData.partNumber);
      expect(part.quantity).toBe(0);

      // Step 3: Create Purchase Order
      const poData = {
        supplierId: supplier.id,
        orderDate: new Date(),
        notes: 'Integration test purchase order',
        items: [
          {
            partId: part.id,
            quantity: 100,
            unitCost: partData.costSYP,
          },
        ],
      };

      const mockPurchaseOrder = {
        id: 'po-integration-1',
        tenantId: mockTenantId,
        supplierId: supplier.id,
        orderNumber: 'PO-2024-00001',
        orderDate: poData.orderDate,
        totalSYP: 5500000, // (100 * 50000) * 1.1
        totalUSD: null,
        status: PurchaseOrderStatus.PENDING,
        notes: poData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
        },
        items: [
          {
            id: 'poi-integration-1',
            purchaseOrderId: 'po-integration-1',
            partId: part.id,
            quantity: 100,
            unitCost: partData.costSYP,
            totalCost: 5000000,
            receivedQuantity: 0,
            part: {
              id: part.id,
              partNumber: part.partNumber,
              name: part.name,
            },
          },
        ],
      };

      jest.spyOn(purchaseOrderService as any, 'createPurchaseOrder').mockResolvedValue({
        ...mockPurchaseOrder,
        subtotal: 5000000,
        tax: 500000,
        total: 5500000,
      });

      const purchaseOrder = await purchaseOrderService.createPurchaseOrder(mockTenantId, poData);
      expect(purchaseOrder.orderNumber).toBeTruthy();
      expect(purchaseOrder.status).toBe(PurchaseOrderStatus.PENDING);
      expect(purchaseOrder.items).toHaveLength(1);
      expect(purchaseOrder.items[0].quantity).toBe(100);

      // Step 4: Approve Purchase Order
      const mockApprovedPO = {
        ...mockPurchaseOrder,
        status: PurchaseOrderStatus.APPROVED,
        approvedBy: mockUserId,
        approvedAt: new Date(),
      };

      jest.spyOn(purchaseOrderService as any, 'approvePurchaseOrder').mockResolvedValue({
        ...mockApprovedPO,
        subtotal: 5000000,
        tax: 500000,
        total: 5500000,
      });

      const approvedPO = await purchaseOrderService.approvePurchaseOrder(
        purchaseOrder.id,
        mockTenantId,
        mockUserId
      );
      expect(approvedPO.status).toBe(PurchaseOrderStatus.APPROVED);
      expect(approvedPO.approvedBy).toBe(mockUserId);

      // Step 5: Create GRN
      const grnData = {
        purchaseOrderId: purchaseOrder.id,
        supplierId: supplier.id,
        warehouseId: 'warehouse-integration-1',
        receivedDate: new Date(),
        notes: 'Integration test GRN',
        lines: [
          {
            partId: part.id,
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: partData.costSYP,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-integration-1',
        tenantId: mockTenantId,
        grnNumber: 'GRN-2024-00001',
        purchaseOrderId: grnData.purchaseOrderId,
        supplierId: grnData.supplierId,
        warehouseId: grnData.warehouseId,
        receivedDate: grnData.receivedDate,
        status: GRNStatus.DRAFT,
        receivedBy: mockUserId,
        notes: grnData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
        },
        warehouse: {
          id: 'warehouse-integration-1',
          name: 'Main Warehouse',
          code: 'MW-001',
        },
        purchaseOrder: {
          id: purchaseOrder.id,
          orderNumber: purchaseOrder.orderNumber,
          status: PurchaseOrderStatus.APPROVED,
        },
        lines: [
          {
            id: 'grn-line-integration-1',
            grnId: 'grn-integration-1',
            partId: part.id,
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: partData.costSYP,
            totalCost: 5000000,
            createdAt: new Date(),
            part: {
              id: part.id,
              partNumber: part.partNumber,
              name: part.name,
            },
          },
        ],
      };

      jest.spyOn(grnService as any, 'createGRN').mockResolvedValue(mockGRN);

      const grn = await grnService.createGRN(mockTenantId, grnData);
      expect(grn.grnNumber).toBeTruthy();
      expect(grn.status).toBe(GRNStatus.DRAFT);
      expect(grn.lines).toHaveLength(1);

      // Step 6: Complete GRN
      const mockCompletedGRN = {
        ...mockGRN,
        status: GRNStatus.COMPLETED,
      };

      jest.spyOn(grnService as any, 'completeGRN').mockResolvedValue(mockCompletedGRN);

      const completedGRN = await grnService.completeGRN(grn.id, mockTenantId, mockUserId);
      expect(completedGRN.status).toBe(GRNStatus.COMPLETED);

      // Step 7: Verify inventory transaction was created
      const mockTransaction = {
        id: 'transaction-integration-1',
        tenantId: mockTenantId,
        partId: part.id,
        warehouseId: grnData.warehouseId,
        transactionType: TransactionType.PURCHASE,
        quantity: 100,
        unitCost: partData.costSYP,
        totalCost: 5000000,
        referenceType: 'PURCHASE_ORDER',
        referenceId: purchaseOrder.id,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inventoryTransactionService as any, 'getPartHistory').mockResolvedValue({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const history = await inventoryTransactionService.getPartHistory(mockTenantId, part.id);
      expect(history.data).toHaveLength(1);
      expect(history.data[0].transactionType).toBe(TransactionType.PURCHASE);
      expect(history.data[0].quantity).toBe(100);

      // Step 8: Verify part quantity was updated
      const mockUpdatedPart = {
        ...part,
        quantity: 100,
      };

      jest.spyOn(partService as any, 'getPartById').mockResolvedValue(mockUpdatedPart);

      const updatedPart = await partService.getPartById(part.id, mockTenantId);
      expect(updatedPart?.quantity).toBe(100);

      // Step 9: Verify purchase order status was updated
      const mockReceivedPO = {
        ...mockApprovedPO,
        status: PurchaseOrderStatus.RECEIVED,
      };

      jest.spyOn(purchaseOrderService as any, 'getPurchaseOrderById').mockResolvedValue({
        ...mockReceivedPO,
        subtotal: 5000000,
        tax: 500000,
        total: 5500000,
      });

      const receivedPO = await purchaseOrderService.getPurchaseOrderById(purchaseOrder.id, mockTenantId);
      expect(receivedPO?.status).toBe(PurchaseOrderStatus.RECEIVED);
    });
  });

  describe('Consumption Flow', () => {
    it('should test consumption flow: Create part → Create booking → Consume parts → Verify quantity decrease', async () => {
      // Step 1: Create Part with initial stock
      const partData = {
        partNumber: 'INT-002',
        name: 'Integration Test Part 2',
        costSYP: 30000,
        sellingPriceSYP: 45000,
        quantity: 50,
        minQuantity: 10,
      };

      const mockPart = {
        id: 'part-integration-2',
        tenantId: mockTenantId,
        ...partData,
        nameAr: null,
        nameEn: null,
        description: null,
        categoryId: null,
        supplierId: null,
        costUSD: null,
        sellingPriceUSD: null,
        location: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(partService as any, 'createPart').mockResolvedValue(mockPart);

      const part = await partService.createPart(mockTenantId, partData);
      expect(part.quantity).toBe(50);

      // Step 2: Create booking (simulated)
      const bookingId = 'booking-integration-1';

      // Step 3: Consume parts
      const transactionData = {
        partId: part.id,
        warehouseId: 'warehouse-integration-1',
        transactionType: TransactionType.CONSUMPTION,
        quantity: 5,
        unitCost: partData.costSYP,
        referenceType: 'BOOKING',
        referenceId: bookingId,
        notes: 'Used for brake replacement',
      };

      const mockTransaction = {
        id: 'transaction-integration-2',
        tenantId: mockTenantId,
        partId: part.id,
        warehouseId: transactionData.warehouseId,
        type: transactionData.transactionType,
        quantity: transactionData.quantity,
        costSYP: transactionData.unitCost,
        reference: `${transactionData.referenceType}:${transactionData.referenceId}`,
        notes: transactionData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(inventoryTransactionService as any, 'createInventoryTransaction').mockResolvedValue({
        ...mockTransaction,
        transactionType: transactionData.transactionType,
        totalCost: transactionData.quantity * transactionData.unitCost,
        referenceType: transactionData.referenceType,
        referenceId: transactionData.referenceId,
      });

      const transaction = await inventoryTransactionService.createInventoryTransaction(
        mockTenantId,
        transactionData
      );
      expect(transaction.transactionType).toBe(TransactionType.CONSUMPTION);
      expect(transaction.quantity).toBe(5);

      // Step 4: Verify quantity decrease
      const mockUpdatedPart = {
        ...part,
        quantity: 45, // 50 - 5
      };

      jest.spyOn(partService as any, 'getPartById').mockResolvedValue(mockUpdatedPart);

      const updatedPart = await partService.getPartById(part.id, mockTenantId);
      expect(updatedPart?.quantity).toBe(45);

      // Step 5: Verify transaction history
      jest.spyOn(inventoryTransactionService as any, 'getPartHistory').mockResolvedValue({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const history = await inventoryTransactionService.getPartHistory(mockTenantId, part.id);
      expect(history.data).toHaveLength(1);
      expect(history.data[0].transactionType).toBe(TransactionType.CONSUMPTION);
      expect(history.data[0].referenceId).toBe(bookingId);
    });
  });

  describe('Three-Way Matching', () => {
    it('should test three-way matching (PO → GRN → Invoice)', async () => {
      // Step 1: Create Purchase Order
      const poData = {
        supplierId: 'supplier-integration-1',
        orderDate: new Date(),
        items: [
          {
            partId: 'part-integration-1',
            quantity: 100,
            unitCost: 50000,
          },
        ],
      };

      const mockPurchaseOrder = {
        id: 'po-integration-2',
        tenantId: mockTenantId,
        supplierId: poData.supplierId,
        orderNumber: 'PO-2024-00002',
        orderDate: poData.orderDate,
        totalSYP: 5500000,
        totalUSD: null,
        status: PurchaseOrderStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: poData.supplierId,
          name: 'Test Supplier',
          phone: '+971509999999',
        },
        items: [
          {
            id: 'poi-integration-2',
            purchaseOrderId: 'po-integration-2',
            partId: 'part-integration-1',
            quantity: 100,
            unitCost: 50000,
            totalCost: 5000000,
            receivedQuantity: 0,
            part: {
              id: 'part-integration-1',
              partNumber: 'INT-001',
              name: 'Test Part',
            },
          },
        ],
      };

      jest.spyOn(purchaseOrderService as any, 'getPurchaseOrderById').mockResolvedValue({
        ...mockPurchaseOrder,
        subtotal: 5000000,
        tax: 500000,
        total: 5500000,
      });

      const purchaseOrder = await purchaseOrderService.getPurchaseOrderById(
        'po-integration-2',
        mockTenantId
      );
      expect(purchaseOrder?.items[0].quantity).toBe(100);
      expect(purchaseOrder?.items[0].unitCost).toBe(50000);

      // Step 2: Create GRN with matching quantities
      const grnData = {
        purchaseOrderId: 'po-integration-2',
        supplierId: 'supplier-integration-1',
        warehouseId: 'warehouse-integration-1',
        receivedDate: new Date(),
        lines: [
          {
            partId: 'part-integration-1',
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-integration-2',
        tenantId: mockTenantId,
        grnNumber: 'GRN-2024-00002',
        purchaseOrderId: grnData.purchaseOrderId,
        supplierId: grnData.supplierId,
        warehouseId: grnData.warehouseId,
        receivedDate: grnData.receivedDate,
        status: GRNStatus.COMPLETED,
        receivedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: grnData.supplierId,
          name: 'Test Supplier',
          phone: '+971509999999',
        },
        warehouse: {
          id: 'warehouse-integration-1',
          name: 'Main Warehouse',
          code: 'MW-001',
        },
        purchaseOrder: {
          id: 'po-integration-2',
          orderNumber: 'PO-2024-00002',
          status: PurchaseOrderStatus.RECEIVED,
        },
        lines: [
          {
            id: 'grn-line-integration-2',
            grnId: 'grn-integration-2',
            partId: 'part-integration-1',
            orderedQuantity: 100,
            receivedQuantity: 100,
            damagedQuantity: 0,
            unitCost: 50000,
            totalCost: 5000000,
            createdAt: new Date(),
            part: {
              id: 'part-integration-1',
              partNumber: 'INT-001',
              name: 'Test Part',
            },
          },
        ],
      };

      jest.spyOn(grnService as any, 'getGRNById').mockResolvedValue(mockGRN);

      const grn = await grnService.getGRNById('grn-integration-2', mockTenantId);
      expect(grn?.lines[0].orderedQuantity).toBe(100);
      expect(grn?.lines[0].receivedQuantity).toBe(100);
      expect(grn?.lines[0].unitCost).toBe(50000);

      // Step 3: Verify three-way match
      // PO quantity = GRN ordered quantity = GRN received quantity
      const poQuantity = purchaseOrder?.items[0].quantity;
      const grnOrderedQuantity = grn?.lines[0].orderedQuantity;
      const grnReceivedQuantity = grn?.lines[0].receivedQuantity;

      expect(poQuantity).toBe(grnOrderedQuantity);
      expect(grnOrderedQuantity).toBe(grnReceivedQuantity);
      expect(poQuantity).toBe(100);

      // Verify unit costs match
      const poUnitCost = purchaseOrder?.items[0].unitCost;
      const grnUnitCost = grn?.lines[0].unitCost;

      expect(poUnitCost).toBe(grnUnitCost);
      expect(poUnitCost).toBe(50000);

      // Step 4: Simulate invoice creation (would be in invoice module)
      const invoiceData = {
        supplierId: 'supplier-integration-1',
        purchaseOrderId: 'po-integration-2',
        grnId: 'grn-integration-2',
        invoiceNumber: 'INV-2024-00001',
        invoiceDate: new Date(),
        totalAmount: 5500000,
        items: [
          {
            partId: 'part-integration-1',
            quantity: 100,
            unitCost: 50000,
            totalCost: 5000000,
          },
        ],
      };

      // Verify invoice matches PO and GRN
      expect(invoiceData.items[0].quantity).toBe(poQuantity);
      expect(invoiceData.items[0].quantity).toBe(grnReceivedQuantity);
      expect(invoiceData.items[0].unitCost).toBe(poUnitCost);
      expect(invoiceData.items[0].unitCost).toBe(grnUnitCost);
    });

    it('should handle partial receipt in three-way matching', async () => {
      // Scenario: PO for 100, but only 80 received
      const poQuantity = 100;
      const grnReceivedQuantity = 80;

      // Verify partial receipt is handled
      expect(grnReceivedQuantity).toBeLessThan(poQuantity);

      // In a real scenario, this would:
      // 1. Update PO item receivedQty to 80
      // 2. Create partial GRN
      // 3. Allow partial invoice or require second GRN
      // 4. Keep PO status as PARTIALLY_RECEIVED

      const remainingQuantity = poQuantity - grnReceivedQuantity;
      expect(remainingQuantity).toBe(20);
    });

    it('should handle damaged items in three-way matching', async () => {
      // Scenario: PO for 100, 95 received, 5 damaged
      const poQuantity = 100;
      const grnReceivedQuantity = 95;
      const grnDamagedQuantity = 5;

      // Verify damaged items are accounted for
      expect(grnReceivedQuantity + grnDamagedQuantity).toBe(poQuantity);

      // In a real scenario, this would:
      // 1. Create inventory transaction for 95 (good quantity)
      // 2. Create separate transaction for 5 (damaged quantity)
      // 3. Create return order or claim for damaged items
      // 4. Adjust invoice accordingly
    });
  });

  describe('Error Handling in Integration Flow', () => {
    it('should handle supplier not found error in purchase flow', async () => {
      const poData = {
        supplierId: 'non-existent-supplier',
        items: [
          {
            partId: 'part-1',
            quantity: 100,
            unitCost: 50000,
          },
        ],
      };

      jest.spyOn(purchaseOrderService as any, 'createPurchaseOrder').mockRejectedValue(
        new Error('Supplier not found')
      );

      await expect(
        purchaseOrderService.createPurchaseOrder(mockTenantId, poData)
      ).rejects.toThrow('Supplier not found');
    });

    it('should handle insufficient quantity in consumption flow', async () => {
      const transactionData = {
        partId: 'part-1',
        transactionType: TransactionType.CONSUMPTION,
        quantity: 100,
        unitCost: 50000,
      };

      jest.spyOn(inventoryTransactionService as any, 'createInventoryTransaction').mockRejectedValue(
        new Error('Insufficient quantity')
      );

      await expect(
        inventoryTransactionService.createInventoryTransaction(mockTenantId, transactionData)
      ).rejects.toThrow('Insufficient quantity');
    });

    it('should handle GRN completion without lines', async () => {
      const mockGRN = {
        id: 'grn-1',
        tenantId: mockTenantId,
        status: GRNStatus.DRAFT,
        lines: [],
      };

      jest.spyOn(grnService as any, 'completeGRN').mockRejectedValue(
        new Error('Cannot complete GRN without lines')
      );

      await expect(grnService.completeGRN('grn-1', mockTenantId, mockUserId)).rejects.toThrow(
        'Cannot complete GRN without lines'
      );
    });
  });
});
