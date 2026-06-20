import { ISupplierRepository } from '../interfaces/ISupplierRepository';
import { CreateSupplierCommand } from '../commands/CreateSupplierCommand';
import { SupplierDTO } from '../dto/SupplierDTO';
import { v4 as uuidv4 } from 'uuid';

export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(command: CreateSupplierCommand): Promise<SupplierDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Create supplier
    const supplier = {
      id: uuidv4(),
      name: dto.name,
      phone: dto.phone,
      address: dto.address,
      email: dto.email,
      contactPerson: dto.contactPerson,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save supplier
    const savedSupplier = await this.supplierRepository.save(supplier);

    return SupplierDTO.fromEntity(savedSupplier);
  }
}
