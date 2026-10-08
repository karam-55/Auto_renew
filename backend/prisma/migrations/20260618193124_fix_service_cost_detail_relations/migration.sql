-- AlterTable
ALTER TABLE "ServiceCostDetail" ADD COLUMN     "assetId" TEXT,
ALTER COLUMN "costCenterId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ServiceCostDetail_assetId_idx" ON "ServiceCostDetail"("assetId");

-- AddForeignKey
ALTER TABLE "ServiceCostDetail" ADD CONSTRAINT "ServiceCostDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
