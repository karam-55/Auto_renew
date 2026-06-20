import { WorkTask } from '../entities/WorkTask';

export class WorkTaskCompletedEvent {
  constructor(
    public readonly workTask: WorkTask,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'WorkTaskCompleted';
  }

  getPayload(): any {
    return {
      workTaskId: this.workTask.id,
      workOrderId: this.workTask.workOrderId,
      description: this.workTask.description.getValue(),
      status: this.workTask.status,
      assignedMechanicId: this.workTask.assignedMechanicId,
      estimatedTime: this.workTask.getEstimatedTimeValue(),
      actualTime: this.workTask.getActualTimeValue(),
      occurredAt: this.occurredAt,
    };
  }
}
