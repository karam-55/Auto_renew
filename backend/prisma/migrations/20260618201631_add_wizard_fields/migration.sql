-- AlterTable
ALTER TABLE "AssetCategory" ADD COLUMN     "salvageValuePercent" DECIMAL(5,2) NOT NULL DEFAULT 10.00;

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "setupStep" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CostCenter" ADD COLUMN     "code" TEXT;
