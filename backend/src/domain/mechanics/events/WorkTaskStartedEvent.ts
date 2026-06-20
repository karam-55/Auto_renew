import { WorkTask } from '../entities/WorkTask';

export class WorkTaskStartedEvent {
  constructor(
    public readonly workTask: WorkTask,
    public readonly occurredAt: Date = new Date()
  ) {}

  getEventName(): string {
    return 'WorkTaskStarted';
  }

  getPayload(): any {
    return {
      workTaskId: this.workTask.id,
      workOrderId: this.workTask.workOrderId,
      description: this.workTask.description.getValue(),
      status: this.workTask.status,
      assignedMechanicId: this.workTask.assignedMechanicId,
      estimatedTime: this.workTask.getEstimatedTimeValue(),
      occurredAt: this.occurredAt,
    };
  }
}
