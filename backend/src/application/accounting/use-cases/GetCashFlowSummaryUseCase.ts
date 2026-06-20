import { IReportRepository } from '../interfaces/IReportRepository';
import { CashFlowSummaryDTO } from '../dto/CashFlowSummaryDTO';

export class GetCashFlowSummaryUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<CashFlowSummaryDTO> {
    const summary = await this.reportRepository.getCashFlowSummary(startDate, endDate);
    return new CashFlowSummaryDTO(
      summary.operating,
      summary.investing,
      summary.financing
    );
  }
}
