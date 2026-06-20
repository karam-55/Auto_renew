import { GetVATSummaryUseCase } from '../use-cases/GetVATSummaryUseCase';

export class GetVATSummaryHandler {
  constructor(private readonly getVATSummary: GetVATSummaryUseCase) {}

  async handle(startDate: Date, endDate: Date) {
    return await this.getVATSummary.execute(startDate, endDate);
  }
}
