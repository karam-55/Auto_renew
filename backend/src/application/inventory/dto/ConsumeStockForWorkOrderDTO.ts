export class ConsumeStockForWorkOrderDTO {
  constructor(
    public readonly workOrderId: string,
    public readonly items: { partId: string; quantity: number; costSYP: number; costUSD?: number }[]
  ) {}

  static fromRequest(body: any): ConsumeStockForWorkOrderDTO {
    return new ConsumeStockForWorkOrderDTO(
      body.workOrderId,
      body.items || []
    );
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.workOrderId) {
      errors.push('Work Order ID is required');
    }

    if (!this.items || this.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (this.items) {
      this.items.forEach((item, index) => {
        if (!item.partId) {
          errors.push(`Part ID is required for item at index ${index}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Quantity must be positive for item at index ${index}`);
        }
        if (!item.costSYP || item.costSYP < 0) {
          errors.push(`Cost SYP must be non-negative for item at index ${index}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
