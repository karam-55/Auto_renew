export class InvoiceItem {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly description: string,
    public readonly quantity: number,
    public readonly priceSYP: number,
    public readonly totalSYP: number,
    public readonly createdAt: Date = new Date(),
    public readonly priceUSD?: number,
    public readonly totalUSD?: number,
    public readonly partId?: string
  ) {}

  static create(
    id: string,
    invoiceId: string,
    description: string,
    quantity: number,
    priceSYP: number,
    priceUSD?: number,
    partId?: string
  ): InvoiceItem {
    const totalSYP = quantity * priceSYP;
    const totalUSD = priceUSD ? quantity * priceUSD : undefined;

    return new InvoiceItem(
      id,
      invoiceId,
      description,
      quantity,
      priceSYP,
      totalSYP,
      new Date(),
      priceUSD,
      totalUSD,
      partId
    );
  }

  updatePrice(priceSYP: number, priceUSD?: number): InvoiceItem {
    const totalSYP = this.quantity * priceSYP;
    const totalUSD = priceUSD ? this.quantity * priceUSD : undefined;

    return new InvoiceItem(
      this.id,
      this.invoiceId,
      this.description,
      this.quantity,
      priceSYP,
      totalSYP,
      this.createdAt,
      priceUSD,
      totalUSD,
      this.partId
    );
  }

  updateQuantity(quantity: number): InvoiceItem {
    const totalSYP = quantity * this.priceSYP;
    const totalUSD = this.priceUSD ? quantity * this.priceUSD : undefined;

    return new InvoiceItem(
      this.id,
      this.invoiceId,
      this.description,
      quantity,
      this.priceSYP,
      totalSYP,
      this.createdAt,
      this.priceUSD,
      totalUSD,
      this.partId
    );
  }
}
