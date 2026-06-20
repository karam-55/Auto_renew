import { WorkTaskStatus } from './WorkTaskStatus';
import { Hours } from '../value-objects/Hours';
import { TaskDescription } from '../value-objects/TaskDescription';

export class WorkTask {
  constructor(
    public readonly id: string,
    public readonly workOrderId: string,
    public readonly description: TaskDescription,
    public readonly status: WorkTaskStatus,
    public readonly estimatedTime: Hours,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly assignedMechanicId?: string,
    public readonly actualTime?: Hours
  ) {}

  static create(
    id: string,
    workOrderId: string,
    description: string,
    estimatedTime: number,
    assignedMechanicId?: string
  ): WorkTask {
    return new WorkTask(
      id,
      workOrderId,
      new TaskDescription(description),
      WorkTaskStatus.PENDING,
      new Hours(estimatedTime),
      new Date(),
      new Date(),
      assignedMechanicId,
      undefined
    );
  }

  start(mechanicId: string): WorkTask {
    if (this.status !== WorkTaskStatus.PENDING) {
      throw new Error('Only pending tasks can be started');
    }

    if (!mechanicId) {
      throw new Error('Work task cannot start without assigned mechanic');
    }

    return new WorkTask(
      this.id,
      this.workOrderId,
      this.description,
      WorkTaskStatus.IN_PROGRESS,
      this.estimatedTime,
      this.createdAt,
      new Date(),
      mechanicId,
      undefined
    );
  }

  complete(actualTime: number): WorkTask {
    if (this.status !== WorkTaskStatus.IN_PROGRESS) {
      throw new Error('Only in-progress tasks can be completed');
    }

    if (actualTime <= 0) {
      throw new Error('Work task cannot finish without actualTime');
    }

    return new WorkTask(
      this.id,
      this.workOrderId,
      this.description,
      WorkTaskStatus.DONE,
      this.estimatedTime,
      this.createdAt,
      new Date(),
      this.assignedMechanicId,
      new Hours(actualTime)
    );
  }

  assignMechanic(mechanicId: string): WorkTask {
    if (this.status === WorkTaskStatus.DONE) {
      throw new Error('Cannot assign mechanic to completed tasks');
    }

    return new WorkTask(
      this.id,
      this.workOrderId,
      this.description,
      this.status,
      this.estimatedTime,
      this.createdAt,
      new Date(),
      mechanicId,
      this.actualTime
    );
  }

  updateEstimatedTime(newEstimatedTime: number): WorkTask {
    if (this.status === WorkTaskStatus.DONE) {
      throw new Error('Cannot update estimated time for completed tasks');
    }

    return new WorkTask(
      this.id,
      this.workOrderId,
      this.description,
      this.status,
      new Hours(newEstimatedTime),
      this.createdAt,
      new Date(),
      this.assignedMechanicId,
      this.actualTime
    );
  }

  isPending(): boolean {
    return this.status === WorkTaskStatus.PENDING;
  }

  isInProgress(): boolean {
    return this.status === WorkTaskStatus.IN_PROGRESS;
  }

  isDone(): boolean {
    return this.status === WorkTaskStatus.DONE;
  }

  hasAssignedMechanic(): boolean {
    return !!this.assignedMechanicId;
  }

  hasActualTime(): boolean {
    return !!this.actualTime;
  }

  getEstimatedTimeValue(): number {
    return this.estimatedTime.getValue();
  }

  getActualTimeValue(): number {
    return this.actualTime ? this.actualTime.getValue() : 0;
  }

  isOverBudget(): boolean {
    if (!this.actualTime) {
      return false;
    }
    return this.actualTime.isGreaterThan(this.estimatedTime);
  }
}
