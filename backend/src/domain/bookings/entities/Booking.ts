import { BookingCode } from '../value-objects/BookingCode';
import { PublicToken } from '../value-objects/PublicToken';
import { BookingStatus, BookingStatusValue } from './BookingStatus';

export class Booking {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly vehicleId: string,
    public readonly status: BookingStatusValue,
    public readonly publicToken: PublicToken,
    public readonly scheduledDate: Date,
    public readonly scheduledTime?: string,
    public readonly notes?: string,
    public readonly estimatedCompletionDate?: Date,
    public readonly actualCompletionDate?: Date,
    public readonly priority?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    customerId: string,
    vehicleId: string,
    scheduledDate: Date,
    publicToken?: PublicToken,
    scheduledTime?: string,
    notes?: string,
    priority?: string
  ): Booking {
    const status = new BookingStatusValue(BookingStatus.PENDING);
    const token = publicToken || PublicToken.generate();

    return new Booking(
      id,
      tenantId,
      customerId,
      vehicleId,
      status,
      token,
      scheduledDate,
      scheduledTime,
      notes,
      undefined,
      undefined,
      priority,
      new Date(),
      new Date()
    );
  }

  changeStatus(newStatus: BookingStatus): Booking {
    const statusValue = new BookingStatusValue(newStatus);

    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status.getValue()} to ${newStatus}`);
    }

    return new Booking(
      this.id,
      this.tenantId,
      this.customerId,
      this.vehicleId,
      statusValue,
      this.publicToken,
      this.scheduledDate,
      this.scheduledTime,
      this.notes,
      this.estimatedCompletionDate,
      this.actualCompletionDate,
      this.priority,
      this.createdAt,
      new Date()
    );
  }

  updateDetails(
    scheduledDate?: Date,
    scheduledTime?: string,
    notes?: string,
    estimatedCompletionDate?: Date,
    priority?: string
  ): Booking {
    return new Booking(
      this.id,
      this.tenantId,
      this.customerId,
      this.vehicleId,
      this.status,
      this.publicToken,
      scheduledDate || this.scheduledDate,
      scheduledTime !== undefined ? scheduledTime : this.scheduledTime,
      notes !== undefined ? notes : this.notes,
      estimatedCompletionDate !== undefined ? estimatedCompletionDate : this.estimatedCompletionDate,
      this.actualCompletionDate,
      priority !== undefined ? priority : this.priority,
      this.createdAt,
      new Date()
    );
  }

  complete(actualCompletionDate: Date): Booking {
    return new Booking(
      this.id,
      this.tenantId,
      this.customerId,
      this.vehicleId,
      new BookingStatusValue(BookingStatus.COMPLETED),
      this.publicToken,
      this.scheduledDate,
      this.scheduledTime,
      this.notes,
      this.estimatedCompletionDate,
      actualCompletionDate,
      this.priority,
      this.createdAt,
      new Date()
    );
  }
}
