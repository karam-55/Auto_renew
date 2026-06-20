import { Request, Response } from 'express';
import { Logger } from '../../../infrastructure/logging/logger';
import { CreateGRN } from '../../../application/inventory/use-cases/CreateGRN';
import { AddGRNItem } from '../../../application/inventory/use-cases/AddGRNItem';
import { ReceiveGRN } from '../../../application/inventory/use-cases/ReceiveGRN';
import { GetGRN } from '../../../application/inventory/use-cases/GetGRN';
import { ListGRNs } from '../../../application/inventory/use-cases/ListGRNs';
import { MockGRNRepository } from '../../../infrastructure/inventory/repositories/MockGRNRepository';
import { MockGRNItemRepository } from '../../../infrastructure/inventory/repositories/MockGRNItemRepository';
import { MockPurchaseOrderItemRepository } from '../../../infrastructure/inventory/repositories/MockPurchaseOrderItemRepository';

export class GRNController {
  private createGRN: CreateGRN;
  private addGRNItem: AddGRNItem;
  private receiveGRN: ReceiveGRN;
  private getGRN: GetGRN;
  private listGRNs: ListGRNs;

  constructor() {
    const grnRepository = new MockGRNRepository();
    const grnItemRepository = new MockGRNItemRepository();
    const poItemRepository = new MockPurchaseOrderItemRepository();

    this.createGRN = new CreateGRN(grnRepository);
    this.addGRNItem = new AddGRNItem(grnRepository, grnItemRepository, poItemRepository);
    this.receiveGRN = new ReceiveGRN(grnRepository, grnItemRepository);
    this.getGRN = new GetGRN(grnRepository);
    this.listGRNs = new ListGRNs(grnRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        purchaseOrderId,
        supplierId,
        receivedDate,
        notes,
      } = req.body;

      const result = await this.createGRN.execute(
        tenantId,
        purchaseOrderId,
        supplierId,
        new Date(receivedDate),
        notes
      );

      res.status(201).json({
        id: result.grn.id,
        tenantId: result.grn.tenantId,
        grnNumber: result.grn.grnNumber.getValue(),
        purchaseOrderId: result.grn.purchaseOrderId,
        supplierId: result.grn.supplierId.getValue(),
        receivedDate: result.grn.receivedDate,
        notes: result.grn.notes,
        isReceived: result.grn.isReceived,
        createdAt: result.grn.createdAt,
        updatedAt: result.grn.updatedAt,
      });
    } catch (error) {
      Logger.error('Create GRN error:', error);
      res.status(500).json({ error: 'Failed to create GRN' });
    }
  }

  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const {
        grnId,
        purchaseOrderItemId,
        partId,
        description,
        orderedQuantity,
        receivedQuantity,
        unitPrice,
      } = req.body;

      const result = await this.addGRNItem.execute(
        grnId,
        purchaseOrderItemId,
        partId,
        description,
        orderedQuantity,
        receivedQuantity,
        unitPrice
      );

      res.status(201).json({
        grn: {
          id: result.grn.id,
        },
        item: {
          id: result.item.id,
          grnId: result.item.grnId,
          purchaseOrderItemId: result.item.purchaseOrderItemId,
          partId: result.item.partId,
          description: result.item.description,
          orderedQuantity: result.item.orderedQuantity,
          receivedQuantity: result.item.getReceivedQuantityValue(),
          unitPrice: result.item.unitPrice,
          total: result.item.total,
        },
      });
    } catch (error) {
      Logger.error('Add GRN item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item to GRN';
      if (errorMessage === 'GRN not found' || errorMessage === 'Purchase order item not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage === 'Cannot add items to received GRN' || errorMessage === 'Received quantity cannot exceed ordered quantity') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to add item to GRN' });
    }
  }

  async receive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.receiveGRN.execute(id);

      res.json({
        id: result.grn.id,
        tenantId: result.grn.tenantId,
        grnNumber: result.grn.grnNumber.getValue(),
        purchaseOrderId: result.grn.purchaseOrderId,
        supplierId: result.grn.supplierId.getValue(),
        receivedDate: result.grn.receivedDate,
        notes: result.grn.notes,
        isReceived: result.grn.isReceived,
        createdAt: result.grn.createdAt,
        updatedAt: result.grn.updatedAt,
        events: result.events.map(event => ({
          eventName: event.getEventName(),
          payload: event.getPayload(),
        })),
      });
    } catch (error) {
      Logger.error('Receive GRN error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to receive GRN';
      if (errorMessage === 'GRN not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      if (errorMessage === 'GRN is already received' || errorMessage === 'Cannot receive GRN without items') {
        res.status(400).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to receive GRN' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const grn = await this.getGRN.execute(id);

      res.json({
        id: grn.id,
        tenantId: grn.tenantId,
        grnNumber: grn.grnNumber.getValue(),
        purchaseOrderId: grn.purchaseOrderId,
        supplierId: grn.supplierId.getValue(),
        receivedDate: grn.receivedDate,
        notes: grn.notes,
        isReceived: grn.isReceived,
        createdAt: grn.createdAt,
        updatedAt: grn.updatedAt,
      });
    } catch (error) {
      Logger.error('Get GRN error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get GRN';
      if (errorMessage === 'GRN not found') {
        res.status(404).json({ error: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to get GRN' });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, purchaseOrderId } = req.query;

      let grns;
      if (purchaseOrderId && typeof purchaseOrderId === 'string') {
        grns = await this.listGRNs.executeByPurchaseOrder(purchaseOrderId);
      } else if (tenantId && typeof tenantId === 'string') {
        grns = await this.listGRNs.execute(tenantId);
      } else {
        res.status(400).json({ error: 'Tenant ID is required' });
        return;
      }

      res.json(
        grns.map(grn => ({
          id: grn.id,
          tenantId: grn.tenantId,
          grnNumber: grn.grnNumber.getValue(),
          purchaseOrderId: grn.purchaseOrderId,
          supplierId: grn.supplierId.getValue(),
          receivedDate: grn.receivedDate,
          notes: grn.notes,
          isReceived: grn.isReceived,
          createdAt: grn.createdAt,
          updatedAt: grn.updatedAt,
        }))
      );
    } catch (error) {
      Logger.error('List GRNs error:', error);
      res.status(500).json({ error: 'Failed to list GRNs' });
    }
  }
}
