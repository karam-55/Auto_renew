import { GRNNumber } from '../value-objects/GRNNumber';
import { SupplierId } from '../../po/value-objects/SupplierId';

export class GRN {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly grnNumber: GRNNumber,
    public readonly purchaseOrderId: string,
    public readonly supplierId: SupplierId,
    public readonly receivedDate: Date,
    public readonly notes?: string,
    public readonly isReceived: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    grnNumber: GRNNumber,
    purchaseOrderId: string,
    supplierId: SupplierId,
    receivedDate: Date,
    notes?: string
  ): GRN {
    return new GRN(
      id,
      tenantId,
      grnNumber,
      purchaseOrderId,
      supplierId,
      receivedDate,
      notes,
      false,
      new Date(),
      new Date()
    );
  }

  receive(): GRN {
    if (this.isReceived) {
      throw new Error('GRN is already received');
    }

    return new GRN(
      this.id,
      this.tenantId,
      this.grnNumber,
      this.purchaseOrderId,
      this.supplierId,
      this.receivedDate,
      this.notes,
      true,
      this.createdAt,
      new Date()
    );
  }

  isPending(): boolean {
    return !this.isReceived;
  }

  isReceivedStatus(): boolean {
    return this.isReceived;
  }
}
