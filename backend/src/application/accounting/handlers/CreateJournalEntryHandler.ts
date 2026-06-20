import { CreateJournalEntryUseCase } from '../use-cases/CreateJournalEntryUseCase';
import { CreateJournalEntryCommand } from '../commands/CreateJournalEntryCommand';

export class CreateJournalEntryHandler {
  constructor(private readonly createJournalEntry: CreateJournalEntryUseCase) {}

  async handle(command: CreateJournalEntryCommand) {
    return await this.createJournalEntry.execute(command);
  }
}
