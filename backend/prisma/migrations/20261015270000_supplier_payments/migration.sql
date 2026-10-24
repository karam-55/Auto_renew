CREATE TABLE "SupplierPayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "amountSYP" DECIMAL(15,2) NOT NULL,
  "amountUSD" DECIMAL(15,2),
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "originalAmount" DECIMAL(15,2),
  "originalCurrency" TEXT,
  "exchangeRateUsed" DECIMAL(18,6),
  "idempotencyKey" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupplierPayment"
  ADD CONSTRAINT "SupplierPayment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "SupplierPayment_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SupplierPayment_tenantId_idempotencyKey_key"
  ON "SupplierPayment"("tenantId", "idempotencyKey");
CREATE INDEX "SupplierPayment_tenantId_supplierId_paymentDate_idx"
  ON "SupplierPayment"("tenantId", "supplierId", "paymentDate");
CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");
