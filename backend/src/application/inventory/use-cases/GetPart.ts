import { PartRepository } from '../interfaces/PartRepository';
import { Part } from '../../../domain/inventory/entities/Part';

export class GetPart {
  constructor(private readonly partRepository: PartRepository) {}

  async execute(partId: string): Promise<Part> {
    const part = await this.partRepository.findById(partId);

    if (!part) {
      throw new Error('Part not found');
    }

    return part;
  }
}
