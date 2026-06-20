import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreatePurchaseOrder } from '../../../application/inventory/use-cases/CreatePurchaseOrder';
import { AddItemToPO } from '../../../application/inventory/use-cases/AddItemToPO';
import { RemoveItemFromPO } from '../../../application/inventory/use-cases/RemoveItemFromPO';
import { SubmitPurchaseOrder } from '../../../application/inventory/use-cases/SubmitPurchaseOrder';
import { CancelPurchaseOrder } from '../../../application/inventory/use-cases/CancelPurchaseOrder';
import { GetPurchaseOrder } from '../../../application/inventory/use-cases/GetPurchaseOrder';
import { ListPurchaseOrders } from '../../../application/inventory/use-cases/ListPurchaseOrders';
import { MockPurchaseOrderRepository } from '../../../infrastructure/inventory/repositories/MockPurchaseOrderRepository';
import { MockPurchaseOrderItemRepository } from '../../../infrastructure/inventory/repositories/MockPurchaseOrderItemRepository';

export class POController {
  private createPO: CreatePurchaseOrder;
  private addItemToPO: AddItemToPO;
  private removeItemFromPO: RemoveItemFromPO;
  private submitPO: SubmitPurchaseOrder;
  private cancelPO: CancelPurchaseOrder;
  private getPO: GetPurchaseOrder;
  private listPOs: ListPurchaseOrders;

  constructor() {
    const poRepository = new MockPurchaseOrderRepository();
    const poItemRepository = new MockPurchaseOrderItemRepository();

    this.createPO = new CreatePurchaseOrder(poRepository);
    this.addItemToPO = new AddItemToPO(poRepository, poItemRepository);
    this.removeItemFromPO = new RemoveItemFromPO(poRepository, poItemRepository);
    this.submitPO = new SubmitPurchaseOrder(poRepository, poItemRepository);
    this.cancelPO = new CancelPurchaseOrder(poRepository);
    this.getPO = new GetPurchaseOrder(poRepository);
    this.listPOs = new ListPurchaseOrders(poRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        supplierId,
        orderDate,
        totalAmount,
        expectedDeliveryDate,
        notes,
      } = req.body;

      const result = await this.createPO.execute(
        tenantId,
        supplierId,
        new Date(orderDate),
        totalAmount,
        expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        notes
      );

      res.status(201).json({
        id: result.purchaseOrder.id,
        tenantId: result.purchaseOrder.tenantId,
        orderNumber: result.purchaseOrder.orderNumber.getValue(),
        supplierId: result.purchaseOrder.supplierId.getValue(),
        status: result.purchaseOrder.status,
        orderDate: result.purchaseOrder.orderDate,
        expectedDeliveryDate: result.purchaseOrder.expectedDeliveryDate,
        totalAmount: result.purchaseOrder.totalAmount,
        notes: result.purchaseOrder.notes,
        createdAt: result.purchaseOrder.createdAt,
        updatedAt: result.purchaseOrder.updatedAt,
      });
    } catch (error) {
      Logger.error('Create PO error:', error);
      res.status(500).json({ error: 'Failed to create purchase order' });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const {
        purchaseOrderId,
        partId,
        description,
        quantity,
        unitPrice,
      } = req.body;

      const result = await this.addItemToPO.execute(
        purchaseOrderId,
        partId,
        description,
        quantity,
        unitPrice
      );

      res.status(201).json({
        purchaseOrder: {
          id: result.purchaseOrder.id,
          totalAmount: result.purchaseOrder.totalAmount,
        },
        item: {
          id: result.item.id,
          purchaseOrderId: result.item.purchaseOrderId,
          partId: result.item.partId,
          description: result.item.description,
          quantity: result.item.quantity,
          unitPrice: result.item.getUnitPriceValue(),
          total: result.item.total,
        },
      });
    } catch (error) {
      Logger.error('Add PO item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to purchase order';
      if (errorMessage === 'Purchase order not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage === 'Cannot add items to non-draft orders') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to add item to purchase order' });
    }
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.removeItemFromPO.execute(id);

      res.json({
        purchaseOrder: {
          id: result.purchaseOrder.id,
          totalAmount: result.purchaseOrder.totalAmount,
        },
      });
    } catch (error) {
      Logger.error('Remove PO item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from purchase order';
      if (errorMessage === 'Purchase order item not found' || errorMessage === 'Purchase order not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage === 'Cannot remove items from non-draft orders') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to remove item from purchase order' });
    }
  }

  async submit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.submitPO.execute(id);

      res.json({
        id: result.purchaseOrder.id,
        tenantId: result.purchaseOrder.tenantId,
        orderNumber: result.purchaseOrder.orderNumber.getValue(),
        supplierId: result.purchaseOrder.supplierId.getValue(),
        status: result.purchaseOrder.status,
        orderDate: result.purchaseOrder.orderDate,
        expectedDeliveryDate: result.purchaseOrder.expectedDeliveryDate,
        totalAmount: result.purchaseOrder.totalAmount,
        notes: result.purchaseOrder.notes,
        createdAt: result.purchaseOrder.createdAt,
        updatedAt: result.purchaseOrder.updatedAt,
      });
    } catch (error) {
      Logger.error('Submit PO error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit purchase order';
      if (errorMessage === 'Purchase order not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage === 'Cannot submit purchase order without items') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to submit purchase order' });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const po = await this.cancelPO.execute(id);

      res.json({
        id: po.id,
        tenantId: po.tenantId,
        orderNumber: po.orderNumber.getValue(),
        supplierId: po.supplierId.getValue(),
        status: po.status,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        totalAmount: po.totalAmount,
        notes: po.notes,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
      });
    } catch (error) {
      Logger.error('Cancel PO error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel purchase order';
      if (errorMessage === 'Purchase order not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to cancel purchase order' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const po = await this.getPO.execute(id);

      res.json({
        id: po.id,
        tenantId: po.tenantId,
        orderNumber: po.orderNumber.getValue(),
        supplierId: po.supplierId.getValue(),
        status: po.status,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        totalAmount: po.totalAmount,
        notes: po.notes,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
      });
    } catch (error) {
      Logger.error('Get PO error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get purchase order';
      if (errorMessage === 'Purchase order not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get purchase order' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, supplierId } = req.query;

      let pos;
      if (supplierId && typeof supplierId === 'string') {
        pos = await this.listPOs.executeBySupplier(supplierId);
      } else if (tenantId && typeof tenantId === 'string') {
        pos = await this.listPOs.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        pos.map(po => ({
          id: po.id,
          tenantId: po.tenantId,
          orderNumber: po.orderNumber.getValue(),
          supplierId: po.supplierId.getValue(),
          status: po.status,
          orderDate: po.orderDate,
          expectedDeliveryDate: po.expectedDeliveryDate,
          totalAmount: po.totalAmount,
          notes: po.notes,
          createdAt: po.createdAt,
          updatedAt: po.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List POs error:', error);
      res.status(500).json({ error: 'Failed to list purchase orders' });
    }
  }
}
