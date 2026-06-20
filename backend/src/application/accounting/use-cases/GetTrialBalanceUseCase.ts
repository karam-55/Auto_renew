import { IReportRepository } from '../interfaces/IReportRepository';
import { TrialBalanceDTO } from '../dto/TrialBalanceDTO';

export class GetTrialBalanceUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(asOfDate: Date): Promise<TrialBalanceDTO> {
    const accounts = await this.reportRepository.getTrialBalance(asOfDate);
    return new TrialBalanceDTO(accounts);
  }
}
