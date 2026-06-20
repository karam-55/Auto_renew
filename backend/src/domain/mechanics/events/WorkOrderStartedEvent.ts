import { WorkOrder } from '../entities/WorkOrder';

export class WorkOrderStartedEvent {
  constructor(
    public readonly workOrder: WorkOrder,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'WorkOrderStarted';
  }

  getPayload(): any {
    return {
      workOrderId: this.workOrder.id,
      tenantId: this.workOrder.tenantId,
      bookingId: this.workOrder.bookingId,
      status: this.workOrder.status,
      assignedMechanicId: this.workOrder.assignedMechanicId,
      startDate: this.workOrder.startDate,
      notes: this.workOrder.notes,
      occurredAt: this.occurredAt,
    };
  }
}
