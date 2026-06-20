export interface IJournalEntryRepository {
  findById(id: string): Promise<any | null>;
  save(journalEntry: any): Promise<any>;
  listByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
}
