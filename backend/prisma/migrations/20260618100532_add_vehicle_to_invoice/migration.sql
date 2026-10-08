-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "vehicleId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_vehicleId_idx" ON "Invoice"("vehicleId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
