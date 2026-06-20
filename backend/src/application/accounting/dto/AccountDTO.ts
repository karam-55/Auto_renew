export class AccountDTO {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: string,
    public readonly parentId?: string,
    public readonly isActive?: boolean
  ) {}

  static fromEntity(account: any): AccountDTO {
    return new AccountDTO(
      account.id,
      account.code,
      account.name,
      account.type,
      account.parentId,
      account.isActive
    );
  }
}
