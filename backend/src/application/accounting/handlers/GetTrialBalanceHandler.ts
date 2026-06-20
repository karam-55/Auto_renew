import { GetTrialBalanceUseCase } from '../use-cases/GetTrialBalanceUseCase';

export class GetTrialBalanceHandler {
  constructor(private readonly getTrialBalance: GetTrialBalanceUseCase) {}

  async handle(asOfDate: Date) {
    return await this.getTrialBalance.execute(asOfDate);
  }
}
