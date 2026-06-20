export class JournalLineDTO {
  constructor(
    public readonly accountId: string,
    public readonly debit: number,
    public readonly credit: number,
    public readonly description?: string
  ) {}
}
