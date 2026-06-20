import { ApproveAdditionalServiceUseCase } from '../use-cases/ApproveAdditionalServiceUseCase';
import { ApproveAdditionalServiceCommand } from '../commands/ApproveAdditionalServiceCommand';

export class ApproveAdditionalServiceHandler {
  constructor(private readonly approveAdditionalService: ApproveAdditionalServiceUseCase) {}

  async handle(command: ApproveAdditionalServiceCommand) {
    return await this.approveAdditionalService.execute(command);
  }
}
