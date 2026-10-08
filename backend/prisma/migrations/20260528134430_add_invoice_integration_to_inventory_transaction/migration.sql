-- AlterTable
ALTER TABLE "InventoryTransaction" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "invoiceId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryTransaction_invoiceId_idx" ON "InventoryTransaction"("invoiceId");
