import { WorkOrderStatus } from './WorkOrderStatus';

export class WorkOrder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly bookingId: string,
    public readonly status: WorkOrderStatus,
    public readonly assignedMechanicId?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly notes?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static create(
    id: string,
    tenantId: string,
    bookingId: string,
    assignedMechanicId?: string,
    notes?: string
  ): WorkOrder {
    return new WorkOrder(
      id,
      tenantId,
      bookingId,
      WorkOrderStatus.OPEN,
      assignedMechanicId,
      undefined,
      undefined,
      notes,
      new Date(),
      new Date()
    );
  }

  start(hasTasks: boolean): WorkOrder {
    if (this.status !== WorkOrderStatus.OPEN) {
      throw new Error('Only open work orders can be started');
    }

    if (!hasTasks) {
      throw new Error('Work order cannot start without tasks');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      WorkOrderStatus.IN_PROGRESS,
      this.assignedMechanicId,
      new Date(),
      undefined,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  complete(allTasksDone: boolean): WorkOrder {
    if (this.status === WorkOrderStatus.CANCELLED) {
      throw new Error('Cancelled work orders cannot be completed');
    }

    if (!allTasksDone) {
      throw new Error('Work order cannot complete unless all tasks are DONE');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      WorkOrderStatus.COMPLETED,
      this.assignedMechanicId,
      this.startDate,
      new Date(),
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  cancel(): WorkOrder {
    if (this.status === WorkOrderStatus.COMPLETED) {
      throw new Error('Completed work orders cannot be cancelled');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      WorkOrderStatus.CANCELLED,
      this.assignedMechanicId,
      this.startDate,
      this.endDate,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  setWaitingForParts(): WorkOrder {
    if (this.status !== WorkOrderStatus.IN_PROGRESS) {
      throw new Error('Only in-progress work orders can be set to waiting for parts');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      WorkOrderStatus.WAITING_PARTS,
      this.assignedMechanicId,
      this.startDate,
      undefined,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  resumeFromWaiting(): WorkOrder {
    if (this.status !== WorkOrderStatus.WAITING_PARTS) {
      throw new Error('Only work orders waiting for parts can be resumed');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      WorkOrderStatus.IN_PROGRESS,
      this.assignedMechanicId,
      this.startDate,
      undefined,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  assignMechanic(mechanicId: string): WorkOrder {
    if (this.status === WorkOrderStatus.COMPLETED || this.status === WorkOrderStatus.CANCELLED) {
      throw new Error('Cannot assign mechanic to completed or cancelled work orders');
    }

    return new WorkOrder(
      this.id,
      this.tenantId,
      this.bookingId,
      this.status,
      mechanicId,
      this.startDate,
      this.endDate,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  isOpen(): boolean {
    return this.status === WorkOrderStatus.OPEN;
  }

  isInProgress(): boolean {
    return this.status === WorkOrderStatus.IN_PROGRESS;
  }

  isWaitingForParts(): boolean {
    return this.status === WorkOrderStatus.WAITING_PARTS;
  }

  isCompleted(): boolean {
    return this.status === WorkOrderStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === WorkOrderStatus.CANCELLED;
  }

  canBeStarted(): boolean {
    return this.status === WorkOrderStatus.OPEN;
  }

  canBeCompleted(): boolean {
    return this.status === WorkOrderStatus.IN_PROGRESS || this.status === WorkOrderStatus.WAITING_PARTS;
  }

  canBeCancelled(): boolean {
    return this.status !== WorkOrderStatus.COMPLETED && this.status !== WorkOrderStatus.CANCELLED;
  }
}
