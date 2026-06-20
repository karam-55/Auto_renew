import { IAccountRepository } from '../interfaces/IAccountRepository';
import { CreateAccountCommand } from '../commands/CreateAccountCommand';
import { AccountDTO } from '../dto/AccountDTO';
import { v4 as uuidv4 } from 'uuid';

export class CreateAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(command: CreateAccountCommand): Promise<AccountDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Check if account code already exists
    const existingAccount = await this.accountRepository.findByCode(dto.code);
    if (existingAccount) {
      throw new Error('Account code already exists');
    }

    // Create account
    const account = {
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      type: dto.type.toUpperCase(),
      parentId: dto.parentId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save account
    const savedAccount = await this.accountRepository.save(account);

    return AccountDTO.fromEntity(savedAccount);
  }
}
