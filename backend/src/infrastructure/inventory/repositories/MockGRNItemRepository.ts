import { GRNItemRepository } from '../../../application/inventory/interfaces/GRNItemRepository';
import { GRNItem } from '../../../domain/inventory/grn/entities/GRNItem';

export class MockGRNItemRepository implements GRNItemRepository {
  private items: Map<string, GRNItem> = new Map();

  async findById(id: string): Promise<GRNItem | null> {
    return this.items.get(id) || null;
  }

  async findByGRNId(grnId: string): Promise<GRNItem[]> {
    return Array.from(this.items.values()).filter(
      item => item.grnId === grnId
    );
  }

  async create(item: GRNItem): Promise<GRNItem> {
    this.items.set(item.id, item);
    return item;
  }

  async update(item: GRNItem): Promise<GRNItem> {
    this.items.set(item.id, item);
    return item;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
