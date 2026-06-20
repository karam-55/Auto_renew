import { IReportRepository } from '../interfaces/IReportRepository';
import { BalanceSheetDTO } from '../dto/BalanceSheetDTO';

export class GetBalanceSheetUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(asOfDate: Date): Promise<BalanceSheetDTO> {
    const balanceSheet = await this.reportRepository.getBalanceSheet(asOfDate);
    return new BalanceSheetDTO(
      balanceSheet.assets,
      balanceSheet.liabilities,
      balanceSheet.equity
    );
  }
}
