import { CreateJournalEntryDTO } from '../dto/CreateJournalEntryDTO';

export class CreateJournalEntryCommand {
  constructor(public readonly dto: CreateJournalEntryDTO) {}
}
