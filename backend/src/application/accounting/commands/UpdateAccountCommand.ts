import { UpdateAccountDTO } from '../dto/UpdateAccountDTO';

export class UpdateAccountCommand {
  constructor(
    public readonly accountId: string,
    public readonly dto: UpdateAccountDTO
  ) {}
}
