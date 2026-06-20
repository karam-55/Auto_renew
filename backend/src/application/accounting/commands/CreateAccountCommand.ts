import { CreateAccountDTO } from '../dto/CreateAccountDTO';

export class CreateAccountCommand {
  constructor(public readonly dto: CreateAccountDTO) {}
}
