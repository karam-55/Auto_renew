import { GetProfitPerBookingReportUseCase } from '../use-cases/GetProfitPerBookingReportUseCase';

export class GetProfitPerBookingReportHandler {
  constructor(private readonly getProfitPerBookingReport: GetProfitPerBookingReportUseCase) {}

  async handle(startDate: Date, endDate: Date) {
    return await this.getProfitPerBookingReport.execute(startDate, endDate);
  }
}
