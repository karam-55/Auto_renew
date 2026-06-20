import { GRNRepository } from '../interfaces/GRNRepository';
import { GRN } from '../../../domain/inventory/grn/entities/GRN';

export class GetGRN {
  constructor(private readonly grnRepository: GRNRepository) {}

  async execute(grnId: string): Promise<GRN> {
    const grn = await this.grnRepository.findById(grnId);

    if (!grn) {
      throw new Error('GRN not found');
    }

    return grn;
  }
}
