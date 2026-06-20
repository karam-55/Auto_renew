import { CreateGRN } from '../use-cases/CreateGRN';
import { CreateGRNCommand } from '../commands/CreateGRNCommand';

export class CreateGRNHandler {
  constructor(private readonly createGRN: CreateGRN) {}

  async handle(command: CreateGRNCommand) {
    const { dto } = command;
    return await this.createGRN.execute(
      dto.tenantId,
      dto.purchaseOrderId,
      dto.supplierId,
      dto.receivedDate,
      dto.notes
    );
  }
}
