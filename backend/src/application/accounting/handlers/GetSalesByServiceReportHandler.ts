import { GetSalesByServiceReportUseCase } from '../use-cases/GetSalesByServiceReportUseCase';

export class GetSalesByServiceReportHandler {
  constructor(private readonly getSalesByServiceReport: GetSalesByServiceReportUseCase) {}

  async handle(startDate: Date, endDate: Date) {
    return await this.getSalesByServiceReport.execute(startDate, endDate);
  }
}
