export class BookingImage {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly url: string,
    public readonly caption?: string,
    public readonly uploadedBy?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(
    id: string,
    bookingId: string,
    url: string,
    caption?: string,
    uploadedBy?: string
  ): BookingImage {
    return new BookingImage(
      id,
      bookingId,
      url,
      caption,
      uploadedBy,
      new Date()
    );
  }

  updateCaption(caption?: string): BookingImage {
    return new BookingImage(
      this.id,
      this.bookingId,
      this.url,
      caption,
      this.uploadedBy,
      this.createdAt
    );
  }
}
