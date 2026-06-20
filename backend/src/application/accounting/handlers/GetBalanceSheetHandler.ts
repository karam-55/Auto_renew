import { GetBalanceSheetUseCase } from '../use-cases/GetBalanceSheetUseCase';

export class GetBalanceSheetHandler {
  constructor(private readonly getBalanceSheet: GetBalanceSheetUseCase) {}

  async handle(asOfDate: Date) {
    return await this.getBalanceSheet.execute(asOfDate);
  }
}
