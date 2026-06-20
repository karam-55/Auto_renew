import { GRNItem } from '../../../domain/inventory/grn/entities/GRNItem';

export interface GRNItemRepository {
  findById(id: string): Promise<GRNItem | null>;
  findByGRNId(grnId: string): Promise<GRNItem[]>;
  create(item: GRNItem): Promise<GRNItem>;
  update(item: GRNItem): Promise<GRNItem>;
  delete(id: string): Promise<void>;
}
