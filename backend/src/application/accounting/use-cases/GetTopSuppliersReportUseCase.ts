import { IReportRepository } from '../interfaces/IReportRepository';
import { TopSuppliersDTO } from '../dto/TopSuppliersDTO';

export class GetTopSuppliersReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(limit: number = 10): Promise<TopSuppliersDTO> {
    const suppliers = await this.reportRepository.getTopSuppliers(limit);
    return new TopSuppliersDTO(suppliers);
  }
}
