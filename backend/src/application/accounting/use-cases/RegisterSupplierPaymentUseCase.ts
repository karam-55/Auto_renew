import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { ISupplierRepository } from '../interfaces/ISupplierRepository';
import { RegisterSupplierPaymentCommand } from '../commands/RegisterSupplierPaymentCommand';
import { PaymentDTO } from '../dto/PaymentDTO';
import { AutoJournalForSupplierPaymentUseCase } from './AutoJournalForSupplierPaymentUseCase';
import { v4 as uuidv4 } from 'uuid';

export class RegisterSupplierPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly supplierRepository: ISupplierRepository,
    private readonly autoJournalForSupplierPayment: AutoJournalForSupplierPaymentUseCase
  ) {}

  async execute(command: RegisterSupplierPaymentCommand): Promise<PaymentDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if supplier exists
    const supplier = await this.supplierRepository.findById(dto.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Create payment
    const payment = {
      id: uuidv4(),
      type: 'SUPPLIER',
      supplierId: dto.supplierId,
      amount: dto.amount,
      method: dto.method.toUpperCase(),
      poId: dto.poId,
      date: new Date(),
      reference: `SUPPAY-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save payment
    const savedPayment = await this.paymentRepository.save(payment);

    // Auto-generate journal entry
    await this.autoJournalForSupplierPayment.execute(savedPayment.id);

    return PaymentDTO.fromEntity(savedPayment);
  }
}
