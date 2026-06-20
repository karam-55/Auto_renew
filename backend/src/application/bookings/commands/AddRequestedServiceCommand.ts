import { AddRequestedServiceDTO } from '../dto/AddRequestedServiceDTO';

export class AddRequestedServiceCommand {
  constructor(public readonly dto: AddRequestedServiceDTO) {}
}
