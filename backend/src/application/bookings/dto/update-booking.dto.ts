export class UpdateBookingDto {
  constructor(
    public readonly scheduledDate?: Date,
    public readonly scheduledTime?: string,
    public readonly notes?: string,
    public readonly estimatedCompletionDate?: Date,
    public readonly priority?: string
  ) {}

  static fromRequest(body: any): UpdateBookingDto {
    return new UpdateBookingDto(
      body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      body.scheduledTime,
      body.notes,
      body.estimatedCompletionDate ? new Date(body.estimatedCompletionDate) : undefined,
      body.priority
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.scheduledDate && isNaN(this.scheduledDate.getTime())) {
      errors.push('Invalid scheduled date');
    }

    if (this.estimatedCompletionDate && isNaN(this.estimatedCompletionDate.getTime())) {
      errors.push('Invalid estimated completion date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
