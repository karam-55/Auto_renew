-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "monthlyWorkingHours" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "serviceOverheadPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00;
