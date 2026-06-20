export interface GeneralLedgerFilters {
  fromDate?: Date;
  toDate?: Date;
  accountId?: string;
  limit?: number;
  offset?: number;
}

export interface GeneralLedgerLine {
  id: string;
  entryId: string;
  entryDate: Date;
  reference?: string | null;
  description: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string | null;
  accountType: string;
  debitSYP: number;
  creditSYP: number;
  debitUSD?: number;
  creditUSD?: number;
  runningBalanceSYP: number;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface GeneralLedgerAccountSection {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string | null;
  accountType: string;
  openingBalanceSYP: number;
  openingBalanceUSD?: number;
  totalDebitSYP: number;
  totalCreditSYP: number;
  totalDebitUSD?: number;
  totalCreditUSD?: number;
  closingBalanceSYP: number;
  closingBalanceUSD?: number;
  lines: GeneralLedgerLine[];
}

export interface GeneralLedgerResponse {
  tenantId: string;
  fromDate: Date;
  toDate: Date;
  sections: GeneralLedgerAccountSection[];
  grandTotalDebitSYP: number;
  grandTotalCreditSYP: number;
  generatedAt: Date;
}
