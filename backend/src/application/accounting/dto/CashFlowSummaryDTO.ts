export class CashFlowSummaryDTO {
  constructor(
    public readonly operating: number,
    public readonly investing: number,
    public readonly financing: number
  ) {}
}
