-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "overheadPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0.10;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "hourlyRate" DECIMAL(12,2);
