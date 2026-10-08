/*
  Warnings:

  - The values [OUTGOING,INCOMING] on the enum `ChequeType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[planNumber]` on the table `InstallmentPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduledDate` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ExchangeRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestAmountSYP` to the `InstallmentPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planNumber` to the `InstallmentPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingAmountSYP` to the `InstallmentPlan` table without a default value. This is not possible if the table is not empty.
  - Made the column `licensePlate` on table `Vehicle` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "FiscalPeriodStatus" AS ENUM ('ACTIVE', 'CLOSED', 'PENDING');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterEnum
BEGIN;
CREATE TYPE "ChequeType_new" AS ENUM ('RECEIVED', 'ISSUED');
ALTER TABLE "Cheque" ALTER COLUMN "type" TYPE "ChequeType_new" USING ("type"::text::"ChequeType_new");
ALTER TYPE "ChequeType" RENAME TO "ChequeType_old";
ALTER TYPE "ChequeType_new" RENAME TO "ChequeType";
DROP TYPE "ChequeType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'ISSUED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "priority" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "scheduledTime" TEXT;

-- AlterTable
ALTER TABLE "Cheque" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "Currency" ADD COLUMN     "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "isVip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ExchangeRate" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FiscalPeriod" ADD COLUMN     "status" "FiscalPeriodStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "InstallmentPlan" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "downPaymentPaidSYP" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "downPaymentPaidUSD" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "interestAmountSYP" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "interestAmountUSD" DECIMAL(12,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "planNumber" TEXT NOT NULL,
ADD COLUMN     "remainingAmountSYP" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "remainingAmountUSD" DECIMAL(12,2),
ADD COLUMN     "supplierId" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "basePrice" DECIMAL(12,2),
ADD COLUMN     "category" TEXT,
ADD COLUMN     "duration" INTEGER;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "color" TEXT,
ALTER COLUMN "licensePlate" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Cheque_customerId_idx" ON "Cheque"("customerId");

-- CreateIndex
CREATE INDEX "Cheque_supplierId_idx" ON "Cheque"("supplierId");

-- CreateIndex
CREATE INDEX "ExchangeRate_tenantId_idx" ON "ExchangeRate"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPlan_planNumber_key" ON "InstallmentPlan"("planNumber");

-- CreateIndex
CREATE INDEX "InstallmentPlan_supplierId_idx" ON "InstallmentPlan"("supplierId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_planNumber_idx" ON "InstallmentPlan"("planNumber");

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_fromCurrencyId_fkey" FOREIGN KEY ("fromCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_toCurrencyId_fkey" FOREIGN KEY ("toCurrencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
