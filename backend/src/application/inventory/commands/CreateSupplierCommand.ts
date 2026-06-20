import { CreateSupplierDTO } from '../dto/CreateSupplierDTO';

export class CreateSupplierCommand {
  constructor(public readonly dto: CreateSupplierDTO) {}
}
