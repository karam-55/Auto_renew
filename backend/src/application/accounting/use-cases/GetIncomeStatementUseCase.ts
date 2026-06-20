import { IReportRepository } from '../interfaces/IReportRepository';
import { IncomeStatementDTO } from '../dto/IncomeStatementDTO';

export class GetIncomeStatementUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<IncomeStatementDTO> {
    const statement = await this.reportRepository.getIncomeStatement(startDate, endDate);
    return new IncomeStatementDTO(
      statement.revenues,
      statement.expenses,
      statement.netProfit
    );
  }
}
