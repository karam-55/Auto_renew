import { IReportRepository } from '../interfaces/IReportRepository';
import { SalesByServiceDTO } from '../dto/SalesByServiceDTO';

export class GetSalesByServiceReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<SalesByServiceDTO[]> {
    const salesData = await this.reportRepository.getSalesByService(startDate, endDate);
    return salesData.map(item => new SalesByServiceDTO(item.serviceId, item.totalAmount));
  }
}
