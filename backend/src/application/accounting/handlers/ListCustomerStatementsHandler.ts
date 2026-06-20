import { ListCustomerStatementsUseCase } from '../use-cases/ListCustomerStatementsUseCase';

export class ListCustomerStatementsHandler {
  constructor(private readonly listCustomerStatements: ListCustomerStatementsUseCase) {}

  async handle(customerId: string) {
    return await this.listCustomerStatements.execute(customerId);
  }
}
