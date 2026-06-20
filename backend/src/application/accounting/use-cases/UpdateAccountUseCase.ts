import { IAccountRepository } from '../interfaces/IAccountRepository';
import { UpdateAccountCommand } from '../commands/UpdateAccountCommand';
import { AccountDTO } from '../dto/AccountDTO';

export class UpdateAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(command: UpdateAccountCommand): Promise<AccountDTO> {
    const { accountId, dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Find account
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Update account
    const updatedAccount = {
      ...account,
      name: dto.name || account.name,
      isActive: dto.isActive !== undefined ? dto.isActive : account.isActive,
      updatedAt: new Date(),
    };

    const savedAccount = await this.accountRepository.update(updatedAccount);

    return AccountDTO.fromEntity(savedAccount);
  }
}
