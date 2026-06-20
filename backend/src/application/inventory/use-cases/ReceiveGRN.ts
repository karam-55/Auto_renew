import { GRNRepository } from '../interfaces/GRNRepository';
import { GRNItemRepository } from '../interfaces/GRNItemRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';
import { GRNReceivedEvent } from '../../../domain/inventory/grn/events/GRNReceivedEvent';
import { StockIncreasedByGRNEvent } from '../../../domain/inventory/grn/events/StockIncreasedByGRNEvent';

export class ReceiveGRN {
  constructor(
    private readonly grnRepository: GRNRepository,
    private readonly grnItemRepository: GRNItemRepository
  ) {}

  async execute(grnId: string): Promise<{ grn: GRN; events: (GRNReceivedEvent | StockIncreasedByGRNEvent)[] }> {
    // Get the GRN
    const grn = await this.grnRepository.findById(grnId);
    if (!grn) {
      throw new Error('GRN not found');
    }

    if (grn.isReceivedStatus()) {
      throw new Error('GRN is already received');
    }

    // Get GRN items
    const items = await this.grnItemRepository.findByGRNId(grnId);
    if (items.length === 0) {
      throw new Error('Cannot receive GRN without items');
    }

    // Receive the GRN
    const receivedGRN = grn.receive();
    await this.grnRepository.update(receivedGRN);

    // Create events
    const events: (GRNReceivedEvent | StockIncreasedByGRNEvent)[] = [];
    
    // Add GRN received event
    events.push(new GRNReceivedEvent(receivedGRN));

    // Add stock increase events for each item
    for (const item of items) {
      events.push(new StockIncreasedByGRNEvent(
        receivedGRN,
        item.partId,
        item.getReceivedQuantityValue()
      ));
    }

    return { grn: receivedGRN, events };
  }
}
