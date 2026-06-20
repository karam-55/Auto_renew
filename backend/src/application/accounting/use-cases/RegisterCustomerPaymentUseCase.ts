import { IPaymentRepository } from '../interfaces/IPaymentRepository';
import { ICustomerRepository } from '../interfaces/ICustomerRepository';
import { RegisterCustomerPaymentCommand } from '../commands/RegisterCustomerPaymentCommand';
import { PaymentDTO } from '../dto/PaymentDTO';
import { AutoJournalForCustomerPaymentUseCase } from './AutoJournalForCustomerPaymentUseCase';
import { v4 as uuidv4 } from 'uuid';

export class RegisterCustomerPaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly autoJournalForCustomerPayment: AutoJournalForCustomerPaymentUseCase
  ) {}

  async execute(command: RegisterCustomerPaymentCommand): Promise<PaymentDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if customer exists
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create payment
    const payment = {
      id: uuidv4(),
      type: 'CUSTOMER',
      customerId: dto.customerId,
      amount: dto.amount,
      method: dto.method.toUpperCase(),
      invoiceId: dto.invoiceId,
      date: new Date(),
      reference: `PAY-${uuidv4()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save payment
    const savedPayment = await this.paymentRepository.save(payment);

    // Auto-generate journal entry
    await this.autoJournalForCustomerPayment.execute(savedPayment.id);

    return PaymentDTO.fromEntity(savedPayment);
  }
}
