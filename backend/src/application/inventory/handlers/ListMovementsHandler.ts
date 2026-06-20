import { ListMovements } from '../use-cases/ListMovements';
import { ListMovementsQuery } from '../queries/ListMovementsQuery';

export class ListMovementsHandler {
  constructor(private readonly listMovements: ListMovements) {}

  async handle(query: ListMovementsQuery) {
    return await this.listMovements.execute(query.tenantId);
  }
}
