import { Customer } from '../entities/Customer';

export class CustomerCreatedEvent {
  constructor(
    public readonly customer: Customer,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'CustomerCreated';
  }

  getPayload(): any {
    return {
      customerId: this.customer.id,
      tenantId: this.customer.tenantId,
      fullName: this.customer.fullName,
      phone: this.customer.phone.getValue(),
      occurredAt: this.occurredAt,
    };
  }
}
