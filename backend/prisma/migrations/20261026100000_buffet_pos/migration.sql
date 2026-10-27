-- CreateEnum
CREATE TYPE "BuffetBuyerType" AS ENUM ('EMPLOYEE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BuffetSaleStatus" AS ENUM ('OPEN', 'COMPLETING', 'ATTACHED_TO_BOOKING', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BuffetSettlement" AS ENUM ('CASH', 'BANK', 'DEBT');

-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "isBuffetItem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "employeeId" TEXT;

-- CreateTable
CREATE TABLE "BuffetSale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerType" "BuffetBuyerType" NOT NULL,
    "employeeId" TEXT,
    "bookingId" TEXT,
    "status" "BuffetSaleStatus" NOT NULL DEFAULT 'OPEN',
    "settlement" "BuffetSettlement",
    "invoiceId" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuffetSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuffetSaleLine" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "priceSYP" DECIMAL(12,2) NOT NULL,
    "priceUSD" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuffetSaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuffetSale_tenantId_status_idx" ON "BuffetSale"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BuffetSale_tenantId_createdAt_idx" ON "BuffetSale"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "BuffetSale_employeeId_idx" ON "BuffetSale"("employeeId");

-- CreateIndex
CREATE INDEX "BuffetSale_bookingId_idx" ON "BuffetSale"("bookingId");

-- CreateIndex
CREATE INDEX "BuffetSale_invoiceId_idx" ON "BuffetSale"("invoiceId");

-- CreateIndex
CREATE INDEX "BuffetSaleLine_saleId_idx" ON "BuffetSaleLine"("saleId");

-- CreateIndex
CREATE INDEX "BuffetSaleLine_partId_idx" ON "BuffetSaleLine"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_tenantId_barcode_key" ON "Part"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "Invoice_employeeId_idx" ON "Invoice"("employeeId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSale" ADD CONSTRAINT "BuffetSale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSale" ADD CONSTRAINT "BuffetSale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSale" ADD CONSTRAINT "BuffetSale_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSale" ADD CONSTRAINT "BuffetSale_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSaleLine" ADD CONSTRAINT "BuffetSaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "BuffetSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuffetSaleLine" ADD CONSTRAINT "BuffetSaleLine_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

