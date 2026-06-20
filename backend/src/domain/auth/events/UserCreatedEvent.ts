import { User } from '../entities/User';

export class UserCreatedEvent {
  constructor(
    public readonly user: User,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'UserCreated';
  }
}
