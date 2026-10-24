-- Add configurable account mappings and analytical references without rewriting
-- historical journal lines or account balances.

CREATE TABLE "AccountPostingMap" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mappingKey" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AccountPostingMap_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AccountPostingMap"
  ADD CONSTRAINT "AccountPostingMap_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountPostingMap"
  ADD CONSTRAINT "AccountPostingMap_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "AccountPostingMap_tenantId_mappingKey_key"
  ON "AccountPostingMap"("tenantId", "mappingKey");
CREATE INDEX "AccountPostingMap_accountId_idx" ON "AccountPostingMap"("accountId");
CREATE INDEX "AccountPostingMap_tenantId_isActive_idx" ON "AccountPostingMap"("tenantId", "isActive");

ALTER TABLE "Service" ADD COLUMN "revenueAccountId" TEXT, ADD COLUMN "costAccountId" TEXT;
ALTER TABLE "ServiceCategory" ADD COLUMN "revenueAccountId" TEXT, ADD COLUMN "costAccountId" TEXT;
ALTER TABLE "ServiceCategory" ADD COLUMN "costCenterId" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN "exchangeRateUsed" DECIMAL(18,6);
ALTER TABLE "PartCategory"
  ADD COLUMN "inventoryAccountId" TEXT,
  ADD COLUMN "costAccountId" TEXT,
  ADD COLUMN "revenueAccountId" TEXT;
ALTER TABLE "Part"
  ADD COLUMN "inventoryAccountId" TEXT,
  ADD COLUMN "costAccountId" TEXT,
  ADD COLUMN "revenueAccountId" TEXT;

ALTER TABLE "JournalLine"
  ADD COLUMN "bookingId" TEXT,
  ADD COLUMN "serviceId" TEXT,
  ADD COLUMN "bookingServiceId" TEXT,
  ADD COLUMN "costCenterId" TEXT,
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "supplierId" TEXT,
  ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "InvoiceItem" ADD COLUMN "bookingServiceId" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "bookingId" TEXT, ADD COLUMN "serviceId" TEXT, ADD COLUMN "bookingServiceId" TEXT, ADD COLUMN "costCenterId" TEXT;
ALTER TABLE "Expense"
  ADD COLUMN "bookingServiceId" TEXT,
  ADD COLUMN "serviceId" TEXT,
  ADD COLUMN "costCenterId" TEXT,
  ADD COLUMN "originalAmount" DECIMAL(15,2),
  ADD COLUMN "originalCurrency" TEXT,
  ADD COLUMN "exchangeRateUsed" DECIMAL(18,6);

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_revenueAccountId_fkey"
  FOREIGN KEY ("revenueAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Service_costAccountId_fkey"
  FOREIGN KEY ("costAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceCategory"
  ADD CONSTRAINT "ServiceCategory_revenueAccountId_fkey"
  FOREIGN KEY ("revenueAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ServiceCategory_costAccountId_fkey"
  FOREIGN KEY ("costAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceCategory"
  ADD CONSTRAINT "ServiceCategory_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartCategory"
  ADD CONSTRAINT "PartCategory_inventoryAccountId_fkey"
  FOREIGN KEY ("inventoryAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PartCategory_costAccountId_fkey"
  FOREIGN KEY ("costAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PartCategory_revenueAccountId_fkey"
  FOREIGN KEY ("revenueAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Part"
  ADD CONSTRAINT "Part_inventoryAccountId_fkey"
  FOREIGN KEY ("inventoryAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Part_costAccountId_fkey"
  FOREIGN KEY ("costAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Part_revenueAccountId_fkey"
  FOREIGN KEY ("revenueAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalLine"
  ADD CONSTRAINT "JournalLine_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "JournalLine_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "JournalLine_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "JournalLine_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "JournalLine_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "JournalLine_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem"
  ADD CONSTRAINT "InvoiceItem_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryTransaction_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryTransaction_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryTransaction_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_bookingServiceId_fkey"
  FOREIGN KEY ("bookingServiceId") REFERENCES "BookingService"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Expense_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Expense_costCenterId_fkey"
  FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Service_revenueAccountId_idx" ON "Service"("revenueAccountId");
CREATE INDEX "Service_costAccountId_idx" ON "Service"("costAccountId");
CREATE INDEX "ServiceCategory_revenueAccountId_idx" ON "ServiceCategory"("revenueAccountId");
CREATE INDEX "ServiceCategory_costAccountId_idx" ON "ServiceCategory"("costAccountId");
CREATE INDEX "ServiceCategory_costCenterId_idx" ON "ServiceCategory"("costCenterId");
CREATE INDEX "PartCategory_inventoryAccountId_idx" ON "PartCategory"("inventoryAccountId");
CREATE INDEX "PartCategory_costAccountId_idx" ON "PartCategory"("costAccountId");
CREATE INDEX "PartCategory_revenueAccountId_idx" ON "PartCategory"("revenueAccountId");
CREATE INDEX "Part_inventoryAccountId_idx" ON "Part"("inventoryAccountId");
CREATE INDEX "Part_costAccountId_idx" ON "Part"("costAccountId");
CREATE INDEX "Part_revenueAccountId_idx" ON "Part"("revenueAccountId");
CREATE INDEX "JournalLine_bookingId_idx" ON "JournalLine"("bookingId");
CREATE INDEX "JournalLine_serviceId_idx" ON "JournalLine"("serviceId");
CREATE INDEX "JournalLine_bookingServiceId_idx" ON "JournalLine"("bookingServiceId");
CREATE INDEX "JournalLine_costCenterId_idx" ON "JournalLine"("costCenterId");
CREATE INDEX "JournalLine_customerId_idx" ON "JournalLine"("customerId");
CREATE INDEX "JournalLine_supplierId_idx" ON "JournalLine"("supplierId");
CREATE INDEX "InvoiceItem_bookingServiceId_idx" ON "InvoiceItem"("bookingServiceId");
CREATE INDEX "InventoryTransaction_bookingId_idx" ON "InventoryTransaction"("bookingId");
CREATE INDEX "InventoryTransaction_serviceId_idx" ON "InventoryTransaction"("serviceId");
CREATE INDEX "InventoryTransaction_bookingServiceId_idx" ON "InventoryTransaction"("bookingServiceId");
CREATE INDEX "InventoryTransaction_costCenterId_idx" ON "InventoryTransaction"("costCenterId");
CREATE INDEX "Expense_bookingServiceId_idx" ON "Expense"("bookingServiceId");
CREATE INDEX "Expense_serviceId_idx" ON "Expense"("serviceId");
CREATE INDEX "Expense_costCenterId_idx" ON "Expense"("costCenterId");
