CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED');

ALTER TABLE "BookingService"
  ADD COLUMN "priceFinalized" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BookingJobCost"
  ADD COLUMN "laborCostUSD" DECIMAL(12,2),
  ADD COLUMN "materialCostUSD" DECIMAL(12,2),
  ADD COLUMN "overheadCostUSD" DECIMAL(12,2),
  ADD COLUMN "totalCostUSD" DECIMAL(12,2),
  ADD COLUMN "exchangeRateUsed" DECIMAL(18,6);

CREATE UNIQUE INDEX "BookingJobCost_bookingId_serviceId_key"
  ON "BookingJobCost"("bookingId", "serviceId");

CREATE TABLE "WorkOrder" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdById" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkOrder"
  ADD CONSTRAINT "WorkOrder_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "WorkOrder_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "WorkOrder_bookingId_key" ON "WorkOrder"("bookingId");
CREATE INDEX "WorkOrder_tenantId_status_createdAt_idx"
  ON "WorkOrder"("tenantId", "status", "createdAt");

INSERT INTO "WorkOrder" ("id", "tenantId", "bookingId", "status", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "tenantId", "id", 'OPEN', "createdAt", CURRENT_TIMESTAMP
FROM "Booking"
WHERE "deletedAt" IS NULL
ON CONFLICT ("bookingId") DO NOTHING;
