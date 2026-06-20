import { GetTopCustomersReportUseCase } from '../use-cases/GetTopCustomersReportUseCase';

export class GetTopCustomersReportHandler {
  constructor(private readonly getTopCustomersReport: GetTopCustomersReportUseCase) {}

  async handle(limit: number = 10) {
    return await this.getTopCustomersReport.execute(limit);
  }
}
