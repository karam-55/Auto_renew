import { JournalLineDTO } from './JournalLineDTO';

export class CreateJournalEntryDTO {
  constructor(
    public readonly date: Date,
    public readonly reference: string,
    public readonly lines: JournalLineDTO[]
  ) {}

  static fromRequest(body: any): CreateJournalEntryDTO {
    const lines = (body.lines || []).map((line: any) => new JournalLineDTO(
      line.accountId,
      line.debit,
      line.credit,
      line.description
    ));
    return new CreateJournalEntryDTO(
      new Date(body.date),
      body.reference,
      lines
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.date) {
      errors.push('Date is required');
    }

    if (isNaN(this.date.getTime())) {
      errors.push('Invalid date');
    }

    if (!this.reference || this.reference.trim().length === 0) {
      errors.push('Reference is required');
    }

    if (!this.lines || this.lines.length === 0) {
      errors.push('At least one journal line is required');
    }

    if (this.lines) {
      this.lines.forEach((line, index) => {
        if (!line.accountId) {
          errors.push(`Account ID is required for line at index ${index}`);
        }
        if (line.debit < 0) {
          errors.push(`Debit must be non-negative for line at index ${index}`);
        }
        if (line.credit < 0) {
          errors.push(`Credit must be non-negative for line at index ${index}`);
        }
        if (line.debit === 0 && line.credit === 0) {
          errors.push(`Either debit or credit must be positive for line at index ${index}`);
        }
      });
    }

    // Check if total debit equals total credit
    const totalDebit = this.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = this.lines.reduce((sum, line) => sum + line.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push('Total debit must equal total credit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
