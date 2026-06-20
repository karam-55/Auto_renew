export class JournalEntryDTO {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly reference: string,
    public readonly lines: any[]
  ) {}

  static fromEntity(journalEntry: any): JournalEntryDTO {
    return new JournalEntryDTO(
      journalEntry.id,
      journalEntry.date,
      journalEntry.reference,
      journalEntry.lines || []
    );
  }
}
