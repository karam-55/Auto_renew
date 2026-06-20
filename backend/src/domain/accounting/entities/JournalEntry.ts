import { EntryDate } from '../value-objects/EntryDate';
import { JournalStatus } from './JournalStatus';

export class JournalEntry {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly entryNumber: string,
    public readonly entryDate: EntryDate,
    public readonly description: string,
    public readonly status: JournalStatus,
    public readonly reference?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    entryNumber: string,
    entryDate: EntryDate,
    description: string,
    reference?: string
  ): JournalEntry {
    return new JournalEntry(
      id,
      tenantId,
      entryNumber,
      entryDate,
      description,
      JournalStatus.DRAFT,
      reference,
      new Date(),
      new Date()
    );
  }

  post(): JournalEntry {
    if (this.status !== JournalStatus.DRAFT) {
      throw new Error('Only draft journal entries can be posted');
    }

    return new JournalEntry(
      this.id,
      this.tenantId,
      this.entryNumber,
      this.entryDate,
      this.description,
      JournalStatus.POSTED,
      this.reference,
      this.createdAt,
      new Date()
    );
  }

  updateDescription(newDescription: string): JournalEntry {
    if (this.status === JournalStatus.POSTED) {
      throw new Error('Posted journal entries cannot be modified');
    }

    return new JournalEntry(
      this.id,
      this.tenantId,
      this.entryNumber,
      this.entryDate,
      newDescription,
      this.status,
      this.reference,
      this.createdAt,
      new Date()
    );
  }

  updateReference(newReference: string): JournalEntry {
    if (this.status === JournalStatus.POSTED) {
      throw new Error('Posted journal entries cannot be modified');
    }

    return new JournalEntry(
      this.id,
      this.tenantId,
      this.entryNumber,
      this.entryDate,
      this.description,
      this.status,
      newReference,
      this.createdAt,
      new Date()
    );
  }

  isDraft(): boolean {
    return this.status === JournalStatus.DRAFT;
  }

  isPosted(): boolean {
    return this.status === JournalStatus.POSTED;
  }

  canBeModified(): boolean {
    return this.status === JournalStatus.DRAFT;
  }
}
