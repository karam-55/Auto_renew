ALTER TABLE "Service"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "pricingUnit" TEXT,
  ADD COLUMN "vehicleType" TEXT,
  ADD COLUMN "specification" TEXT;

ALTER TABLE "BookingService"
  ADD COLUMN "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "Service_tenantId_code_key" ON "Service"("tenantId", "code");
