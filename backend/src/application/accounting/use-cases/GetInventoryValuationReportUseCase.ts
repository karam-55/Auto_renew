import { IReportRepository } from '../interfaces/IReportRepository';
import { InventoryValuationDTO } from '../dto/InventoryValuationDTO';

export class GetInventoryValuationReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(): Promise<InventoryValuationDTO> {
    const items = await this.reportRepository.getInventoryValuation();
    return new InventoryValuationDTO(items);
  }
}
