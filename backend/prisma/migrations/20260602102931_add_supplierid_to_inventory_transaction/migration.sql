-- AlterTable
ALTER TABLE "InventoryTransaction" ADD COLUMN     "supplierId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryTransaction_supplierId_idx" ON "InventoryTransaction"("supplierId");

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
