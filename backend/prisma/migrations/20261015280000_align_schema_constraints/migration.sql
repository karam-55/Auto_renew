-- Align legacy schema details with the current Prisma model.
ALTER TABLE "BookingServiceMaterial"
  DROP CONSTRAINT "BookingServiceMaterial_bookingServiceId_fkey",
  ADD CONSTRAINT "BookingServiceMaterial_bookingServiceId_fkey"
    FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingServiceMaterial"
  DROP CONSTRAINT "BookingServiceMaterial_partId_fkey",
  ADD CONSTRAINT "BookingServiceMaterial_partId_fkey"
    FOREIGN KEY ("partId") REFERENCES "Part"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DealerWarrantyReceipt"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "GoodsReceiptNoteNumberSequence"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InvoiceNumberSequence"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "PurchaseOrderNumberSequence"
  ALTER COLUMN "updatedAt" DROP DEFAULT;
