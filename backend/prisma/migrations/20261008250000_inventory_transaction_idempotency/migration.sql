ALTER TABLE "InventoryTransaction" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "InventoryTransaction_tenantId_idempotencyKey_key"
  ON "InventoryTransaction" ("tenantId", "idempotencyKey");
