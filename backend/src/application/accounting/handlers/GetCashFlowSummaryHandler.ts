import { GetCashFlowSummaryUseCase } from '../use-cases/GetCashFlowSummaryUseCase';

export class GetCashFlowSummaryHandler {
  constructor(private readonly getCashFlowSummary: GetCashFlowSummaryUseCase) {}

  async handle(startDate: Date, endDate: Date) {
    return await this.getCashFlowSummary.execute(startDate, endDate);
  }
}
