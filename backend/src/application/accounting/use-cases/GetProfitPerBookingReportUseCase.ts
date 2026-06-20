import { IReportRepository } from '../interfaces/IReportRepository';
import { ProfitPerBookingDTO } from '../dto/ProfitPerBookingDTO';

export class GetProfitPerBookingReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<ProfitPerBookingDTO[]> {
    const profitData = await this.reportRepository.getProfitPerBooking(startDate, endDate);
    return profitData.map(item => new ProfitPerBookingDTO(
      item.bookingId,
      item.revenue,
      item.cost,
      item.profit
    ));
  }
}
