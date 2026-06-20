import { OrderNumber } from '../value-objects/OrderNumber';
import { SupplierId } from '../value-objects/SupplierId';
import { PurchaseOrderStatus } from './PurchaseOrderStatus';

export class PurchaseOrder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly orderNumber: OrderNumber,
    public readonly supplierId: SupplierId,
    public readonly status: PurchaseOrderStatus,
    public readonly orderDate: Date,
    public readonly totalAmount: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly expectedDeliveryDate?: Date,
    public readonly notes?: string
  ) {}

  static create(
    id: string,
    tenantId: string,
    orderNumber: OrderNumber,
    supplierId: SupplierId,
    orderDate: Date,
    totalAmount: number,
    expectedDeliveryDate?: Date,
    notes?: string
  ): PurchaseOrder {
    return new PurchaseOrder(
      id,
      tenantId,
      orderNumber,
      supplierId,
      PurchaseOrderStatus.DRAFT,
      orderDate,
      totalAmount,
      new Date(),
      new Date(),
      expectedDeliveryDate,
      notes
    );
  }

  submit(): PurchaseOrder {
    if (this.status !== PurchaseOrderStatus.DRAFT) {
      throw new Error('Only draft orders can be submitted');
    }

    return new PurchaseOrder(
      this.id,
      this.tenantId,
      this.orderNumber,
      this.supplierId,
      PurchaseOrderStatus.SENT,
      this.orderDate,
      this.totalAmount,
      this.createdAt,
      new Date(),
      this.expectedDeliveryDate,
      this.notes
    );
  }

  cancel(): PurchaseOrder {
    if (this.status === PurchaseOrderStatus.RECEIVED) {
      throw new Error('Received orders cannot be cancelled');
    }

    return new PurchaseOrder(
      this.id,
      this.tenantId,
      this.orderNumber,
      this.supplierId,
      PurchaseOrderStatus.CANCELLED,
      this.orderDate,
      this.totalAmount,
      this.createdAt,
      new Date(),
      this.expectedDeliveryDate,
      this.notes
    );
  }

  markAsReceived(): PurchaseOrder {
    if (this.status !== PurchaseOrderStatus.SENT) {
      throw new Error('Only sent orders can be marked as received');
    }

    return new PurchaseOrder(
      this.id,
      this.tenantId,
      this.orderNumber,
      this.supplierId,
      PurchaseOrderStatus.RECEIVED,
      this.orderDate,
      this.totalAmount,
      this.createdAt,
      new Date(),
      this.expectedDeliveryDate,
      this.notes
    );
  }

  updateTotalAmount(newTotal: number): PurchaseOrder {
    return new PurchaseOrder(
      this.id,
      this.tenantId,
      this.orderNumber,
      this.supplierId,
      this.status,
      this.orderDate,
      newTotal,
      this.createdAt,
      new Date(),
      this.expectedDeliveryDate,
      this.notes
    );
  }

  isDraft(): boolean {
    return this.status === PurchaseOrderStatus.DRAFT;
  }

  isSent(): boolean {
    return this.status === PurchaseOrderStatus.SENT;
  }

  isReceived(): boolean {
    return this.status === PurchaseOrderStatus.RECEIVED;
  }

  isCancelled(): boolean {
    return this.status === PurchaseOrderStatus.CANCELLED;
  }

  canBeSubmitted(): boolean {
    return this.status === PurchaseOrderStatus.DRAFT;
  }

  canBeCancelled(): boolean {
    return this.status === PurchaseOrderStatus.DRAFT || this.status === PurchaseOrderStatus.SENT;
  }
}
