-- Quantities are stored in each part's base unit, which may be fractional
-- (for example, 3.5 litres of oil). Existing integer quantities convert exactly.

ALTER TABLE "ServicePart"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);

ALTER TABLE "Part"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3),
  ALTER COLUMN "minQuantity" TYPE DECIMAL(12,3) USING "minQuantity"::DECIMAL(12,3);

ALTER TABLE "InventoryTransaction"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);

ALTER TABLE "InvoiceItem"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);

ALTER TABLE "PurchaseOrderItem"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3),
  ALTER COLUMN "receivedQty" TYPE DECIMAL(12,3) USING "receivedQty"::DECIMAL(12,3);

ALTER TABLE "GoodsReceiptNoteLine"
  ALTER COLUMN "orderedQuantity" TYPE DECIMAL(12,3) USING "orderedQuantity"::DECIMAL(12,3),
  ALTER COLUMN "receivedQuantity" TYPE DECIMAL(12,3) USING "receivedQuantity"::DECIMAL(12,3),
  ALTER COLUMN "damagedQuantity" TYPE DECIMAL(12,3) USING "damagedQuantity"::DECIMAL(12,3);

ALTER TABLE "InventoryCountItem"
  ALTER COLUMN "expectedQty" TYPE DECIMAL(12,3) USING "expectedQty"::DECIMAL(12,3),
  ALTER COLUMN "actualQty" TYPE DECIMAL(12,3) USING "actualQty"::DECIMAL(12,3),
  ALTER COLUMN "varianceQty" TYPE DECIMAL(12,3) USING "varianceQty"::DECIMAL(12,3);

ALTER TABLE "InventoryCountAdjustment"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);

ALTER TABLE "InventoryTransferItem"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);

ALTER TABLE "MaintenancePackageItem"
  ALTER COLUMN "quantity" TYPE DECIMAL(12,3) USING "quantity"::DECIMAL(12,3);
