import { ReceiveGRN } from '../use-cases/ReceiveGRN';
import { FinalizeGRNCommand } from '../commands/FinalizeGRNCommand';

export class FinalizeGRNHandler {
  constructor(private readonly receiveGRN: ReceiveGRN) {}

  async handle(command: FinalizeGRNCommand) {
    return await this.receiveGRN.execute(command.grnId);
  }
}
