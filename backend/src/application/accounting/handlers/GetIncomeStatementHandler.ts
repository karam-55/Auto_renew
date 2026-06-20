import { GetIncomeStatementUseCase } from '../use-cases/GetIncomeStatementUseCase';

export class GetIncomeStatementHandler {
  constructor(private readonly getIncomeStatement: GetIncomeStatementUseCase) {}

  async handle(startDate: Date, endDate: Date) {
    return await this.getIncomeStatement.execute(startDate, endDate);
  }
}
