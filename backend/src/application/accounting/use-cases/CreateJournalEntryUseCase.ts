import { IJournalEntryRepository } from '../interfaces/IJournalEntryRepository';
import { IAccountRepository } from '../interfaces/IAccountRepository';
import { CreateJournalEntryCommand } from '../commands/CreateJournalEntryCommand';
import { JournalEntryDTO } from '../dto/JournalEntryDTO';
import { v4 as uuidv4 } from 'uuid';

export class CreateJournalEntryUseCase {
  constructor(
    private readonly journalEntryRepository: IJournalEntryRepository,
    private readonly accountRepository: IAccountRepository
  ) {}

  async execute(command: CreateJournalEntryCommand): Promise<JournalEntryDTO> {
    const { dto } = command;

    // Validate DTO
    const validation = dto.validate();
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    // Validate all accounts exist
    for (const line of dto.lines) {
      const account = await this.accountRepository.findById(line.accountId);
      if (!account) {
        throw new Error(`Account with ID ${line.accountId} not found`);
      }
    }

    // Create journal entry
    const journalEntry = {
      id: uuidv4(),
      date: dto.date,
      reference: dto.reference,
      lines: dto.lines.map(line => ({
        id: uuidv4(),
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
      isPosted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save journal entry
    const savedJournalEntry = await this.journalEntryRepository.save(journalEntry);

    return JournalEntryDTO.fromEntity(savedJournalEntry);
  }
}
