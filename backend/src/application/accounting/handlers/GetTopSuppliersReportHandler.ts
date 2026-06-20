import { GetTopSuppliersReportUseCase } from '../use-cases/GetTopSuppliersReportUseCase';

export class GetTopSuppliersReportHandler {
  constructor(private readonly getTopSuppliersReport: GetTopSuppliersReportUseCase) {}

  async handle(limit: number = 10) {
    return await this.getTopSuppliersReport.execute(limit);
  }
}
