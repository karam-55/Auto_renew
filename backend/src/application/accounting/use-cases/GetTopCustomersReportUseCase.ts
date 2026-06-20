import { IReportRepository } from '../interfaces/IReportRepository';
import { TopCustomersDTO } from '../dto/TopCustomersDTO';

export class GetTopCustomersReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(limit: number = 10): Promise<TopCustomersDTO> {
    const customers = await this.reportRepository.getTopCustomers(limit);
    return new TopCustomersDTO(customers);
  }
}
