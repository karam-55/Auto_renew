import { JournalEntry } from '../entities/JournalEntry';

export class JournalEntryPostedEvent {
  constructor(
    public readonly journalEntry: JournalEntry,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'JournalEntryPosted';
  }

  getPayload(): any {
    return {
      journalEntryId: this.journalEntry.id,
      tenantId: this.journalEntry.tenantId,
      entryNumber: this.journalEntry.entryNumber,
      entryDate: this.journalEntry.entryDate.getValue(),
      description: this.journalEntry.description,
      status: this.journalEntry.status,
      reference: this.journalEntry.reference,
      occurredAt: this.occurredAt,
    };
  }
}
