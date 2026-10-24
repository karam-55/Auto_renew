ALTER TABLE "BookingServiceMaterial"
  ADD COLUMN "issuedQuantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN "issuedCostSYP" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "issuedCostUSD" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "issuedAt" TIMESTAMP(3);

ALTER TABLE "InvoiceItem"
  ADD COLUMN "bookingServiceMaterialId" TEXT;

ALTER TABLE "InventoryTransaction"
  ADD COLUMN "bookingServiceMaterialId" TEXT;

ALTER TABLE "InvoiceItem"
  ADD CONSTRAINT "InvoiceItem_bookingServiceMaterialId_fkey"
  FOREIGN KEY ("bookingServiceMaterialId") REFERENCES "BookingServiceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_bookingServiceMaterialId_fkey"
  FOREIGN KEY ("bookingServiceMaterialId") REFERENCES "BookingServiceMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "InventoryTransaction_bookingServiceMaterialId_idx"
  ON "InventoryTransaction"("bookingServiceMaterialId");
CREATE INDEX "InvoiceItem_bookingServiceMaterialId_idx"
  ON "InvoiceItem"("bookingServiceMaterialId");
