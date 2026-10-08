-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "isContra" SET DEFAULT false;

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "exchangeRate" DECIMAL(12,4) NOT NULL DEFAULT 15000.00;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "profitAmountSYP" DECIMAL(12,2),
ADD COLUMN     "profitAmountUSD" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "Account_category_idx" ON "Account"("category");
