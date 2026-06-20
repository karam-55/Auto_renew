import { GRNRepository } from '../interfaces/GRNRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';
import { GRNNumber } from '../../../domain/inventory/grn/value-objects/GRNNumber';
import { SupplierId } from '../../../domain/inventory/po/value-objects/SupplierId';
import { GRNCreatedEvent } from '../../../domain/inventory/grn/events/GRNCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export class CreateGRN {
  constructor(private readonly grnRepository: GRNRepository) {}

  async execute(
    tenantId: string,
    purchaseOrderId: string,
    supplierId: string,
    receivedDate: Date,
    notes?: string
  ): Promise<{ grn: GRN; event: GRNCreatedEvent }> {
    // Generate GRN number
    const grnNumber = GRNNumber.generate();
    const supplierIdVO = new SupplierId(supplierId);

    // Create GRN entity
    const grnId = uuidv4();
    const grn = GRN.create(
      grnId,
      tenantId,
      grnNumber,
      purchaseOrderId,
      supplierIdVO,
      receivedDate,
      notes
    );

    // Save GRN
    const createdGRN = await this.grnRepository.create(grn);

    // Create event
    const event = new GRNCreatedEvent(createdGRN);

    return { grn: createdGRN, event };
  }
}
