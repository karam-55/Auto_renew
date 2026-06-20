export class VATSummaryDTO {
  constructor(
    public readonly period: string,
    public readonly totalSalesVAT: number,
    public readonly totalPurchasesVAT: number,
    public readonly netVAT: number
  ) {}
}
