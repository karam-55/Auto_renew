import { ISupplierRepository } from '../interfaces/ISupplierRepository';
import { UpdateSupplierCommand } from '../commands/UpdateSupplierCommand';
import { SupplierDTO } from '../dto/SupplierDTO';

export class UpdateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(command: UpdateSupplierCommand): Promise<SupplierDTO> {
    const { supplierId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find supplier
    const supplier = await this.supplierRepository.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Update supplier
    const updatedSupplier = {
      ...supplier,
      name: dto.name || supplier.name,
      phone: dto.phone || supplier.phone,
      address: dto.address !== undefined ? dto.address : supplier.address,
      contactPerson: dto.contactPerson !== undefined ? dto.contactPerson : supplier.contactPerson,
      updatedAt: new Date(),
    };

    const savedSupplier = await this.supplierRepository.update(updatedSupplier);

    return SupplierDTO.fromEntity(savedSupplier);
  }
}
