export class Permission {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly resource: string,
    public readonly action: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    name: string,
    description: string,
    resource: string,
    action: string
  ): Permission {
    return new Permission(
      id,
      name,
      description,
      resource,
      action,
      new Date(),
      new Date()
    );
  }
}
