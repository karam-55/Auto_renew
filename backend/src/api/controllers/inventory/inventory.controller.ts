import { Request, Response } from 'express';
import { ErrorMiddleware } from '../../middlewares/error.middleware';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { SupplierRepository } from '../../../infrastructure/repositories/inventory/SupplierRepository';
import { PurchaseOrderRepository } from '../../../infrastructure/repositories/inventory/PurchaseOrderRepository';
import { GRNRepository } from '../../../infrastructure/repositories/inventory/GRNRepository';
import { StockItemRepository } from '../../../infrastructure/repositories/inventory/StockItemRepository';
import { StockMovementRepository } from '../../../infrastructure/repositories/inventory/StockMovementRepository';

export class InventoryController {
  private supplierRepository: SupplierRepository;
  private purchaseOrderRepository: PurchaseOrderRepository;
  private grnRepository: GRNRepository;
  private stockItemRepository: StockItemRepository;
  private stockMovementRepository: StockMovementRepository;

  constructor() {
    this.supplierRepository = new SupplierRepository();
    this.purchaseOrderRepository = new PurchaseOrderRepository();
    this.grnRepository = new GRNRepository();
    this.stockItemRepository = new StockItemRepository();
    this.stockMovementRepository = new StockMovementRepository();
  }

  // Supplier endpoints
  async createSupplier(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, phone, address, contactPerson, contactPhone, creditLimit, notes, paymentTerms } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      const supplier = await this.supplierRepository.save({
        id: crypto.randomUUID(),
        tenantId,
        name,
        phone,
        address,
        contactPerson,
        contactPhone,
        creditLimit,
        notes,
        paymentTerms,
        status: 'ACTIVE',
      });

      ErrorMiddleware.success(res, supplier, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create supplier', 500);
    }
  }

  async listSuppliers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const suppliers = await this.supplierRepository.list(tenantId);

      ErrorMiddleware.success(res, suppliers, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list suppliers', 500);
    }
  }

  // Purchase Order endpoints
  async createPurchaseOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { supplierId, orderNumber, orderDate, totalAmount, notes } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      // TODO: Map to domain PurchaseOrder entity - placeholder for now
      const purchaseOrder = await this.purchaseOrderRepository.create({
        id: crypto.randomUUID(),
        tenantId,
        supplierId,
        orderNumber,
        orderDate,
        totalAmount,
        notes,
      } as any);

      ErrorMiddleware.success(res, purchaseOrder, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create purchase order', 500);
    }
  }

  async listPurchaseOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const purchaseOrders = await this.purchaseOrderRepository.findByTenantId(tenantId);

      ErrorMiddleware.success(res, purchaseOrders, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list purchase orders', 500);
    }
  }

  // GRN endpoints
  async createGRN(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { supplierId, purchaseOrderId, grnNumber, receivedDate, notes } = req.body;
      const tenantId = req.user?.tenantId || 'default';

      // TODO: Map to domain GRN entity - placeholder for now
      const grn = await this.grnRepository.create({
        id: crypto.randomUUID(),
        tenantId,
        supplierId,
        purchaseOrderId,
        grnNumber,
        receivedDate,
        notes,
      } as any);

      ErrorMiddleware.success(res, grn, 201);
    } catch (error) {
      ErrorMiddleware.error(res, 'CREATE_ERROR', 'Failed to create GRN', 500);
    }
  }

  async listGRNs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const grns = await this.grnRepository.findByTenantId(tenantId);

      ErrorMiddleware.success(res, grns, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list GRNs', 500);
    }
  }

  // Stock endpoints
  async listStockItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stockItems = await this.stockItemRepository.findByWarehouseId('default');

      ErrorMiddleware.success(res, stockItems, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list stock items', 500);
    }
  }

  async listStockMovements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const movements = await this.stockMovementRepository.findByTenantId(tenantId);

      ErrorMiddleware.success(res, movements, 200);
    } catch (error) {
      ErrorMiddleware.error(res, 'FETCH_ERROR', 'Failed to list stock movements', 500);
    }
  }
}
