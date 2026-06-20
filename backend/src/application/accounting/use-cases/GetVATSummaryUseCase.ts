import { IJournalEntryRepository } from '../interfaces/IJournalEntryRepository';
import { VATSummaryDTO } from '../dto/VATSummaryDTO';

export class GetVATSummaryUseCase {
  constructor(private readonly journalEntryRepository: IJournalEntryRepository) {}

  async execute(startDate: Date, endDate: Date): Promise<VATSummaryDTO> {
    const journalEntries = await this.journalEntryRepository.listByDateRange(startDate, endDate);

    let totalSalesVAT = 0;
    let totalPurchasesVAT = 0;

    for (const entry of journalEntries) {
      for (const line of entry.lines) {
        // VAT account code is 2200
        if (line.accountCode === '2200') {
          if (entry.sourceType === 'INVOICE') {
            totalSalesVAT += line.credit; // VAT on sales is a credit
          } else if (entry.sourceType === 'GRN') {
            totalPurchasesVAT += line.debit; // VAT on purchases is a debit
          }
        }
      }
    }

    const netVAT = totalSalesVAT - totalPurchasesVAT;
    const period = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;

    return new VATSummaryDTO(period, totalSalesVAT, totalPurchasesVAT, netVAT);
  }
}
