import { UpdateSupplierDTO } from '../dto/UpdateSupplierDTO';

export class UpdateSupplierCommand {
  constructor(
    public readonly supplierId: string,
    public readonly dto: UpdateSupplierDTO
  ) {}
}
