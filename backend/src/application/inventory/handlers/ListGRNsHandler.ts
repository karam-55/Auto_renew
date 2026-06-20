import { ListGRNs } from '../use-cases/ListGRNs';
import { ListGRNsQuery } from '../queries/ListGRNsQuery';

export class ListGRNsHandler {
  constructor(private readonly listGRNs: ListGRNs) {}

  async handle(query: ListGRNsQuery) {
    return await this.listGRNs.execute(query.tenantId);
  }
}
