import { GetInventoryValuationReportUseCase } from '../use-cases/GetInventoryValuationReportUseCase';

export class GetInventoryValuationReportHandler {
  constructor(private readonly getInventoryValuationReport: GetInventoryValuationReportUseCase) {}

  async handle() {
    return await this.getInventoryValuationReport.execute();
  }
}
