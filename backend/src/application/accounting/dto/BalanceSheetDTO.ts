export class BalanceSheetDTO {
  constructor(
    public readonly assets: any[],
    public readonly liabilities: any[],
    public readonly equity: any[]
  ) {}
}
