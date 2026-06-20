import { AddAdditionalServiceDTO } from '../dto/AddAdditionalServiceDTO';

export class AddAdditionalServiceCommand {
  constructor(public readonly dto: AddAdditionalServiceDTO) {}
}
