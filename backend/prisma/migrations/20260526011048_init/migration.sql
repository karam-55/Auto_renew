/*
  Warnings:

  - You are about to drop the column `appointmentLogId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `electronicSignatureId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `contactName` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Warehouse` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `AppointmentLog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `ElectronicSignature` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supplierId` to the `GoodsReceiptNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GoodsReceiptNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Warehouse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "GRNStatus" AS ENUM ('DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CONSUMPTION';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_appointmentLogId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_electronicSignatureId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "appointmentLogId",
DROP COLUMN "electronicSignatureId";

-- AlterTable
ALTER TABLE "GoodsReceiptNote" ADD COLUMN     "status" "GRNStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "supplierId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "InventoryTransaction" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PartCategory" ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "contactName",
DROP COLUMN "isActive",
ADD COLUMN     "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "isActive",
DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "GoodsReceiptNoteLine" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "orderedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceiptNoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteLine_grnId_idx" ON "GoodsReceiptNoteLine"("grnId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteLine_partId_idx" ON "GoodsReceiptNoteLine"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentLog_bookingId_key" ON "AppointmentLog"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectronicSignature_bookingId_key" ON "ElectronicSignature"("bookingId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_supplierId_idx" ON "GoodsReceiptNote"("supplierId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_warehouseId_idx" ON "GoodsReceiptNote"("warehouseId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_status_idx" ON "GoodsReceiptNote"("status");

-- CreateIndex
CREATE INDEX "Supplier_status_idx" ON "Supplier"("status");

-- CreateIndex
CREATE INDEX "Warehouse_managerId_idx" ON "Warehouse"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_tenantId_code_key" ON "Warehouse"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicSignature" ADD CONSTRAINT "ElectronicSignature_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteLine" ADD CONSTRAINT "GoodsReceiptNoteLine_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceiptNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteLine" ADD CONSTRAINT "GoodsReceiptNoteLine_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentLog" ADD CONSTRAINT "AppointmentLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
