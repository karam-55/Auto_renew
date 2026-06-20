export class IncomeStatementDTO {
  constructor(
    public readonly revenues: any[],
    public readonly expenses: any[],
    public readonly netProfit: number
  ) {}
}
