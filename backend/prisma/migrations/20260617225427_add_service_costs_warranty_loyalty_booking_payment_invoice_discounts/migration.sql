-- CreateEnum
CREATE TYPE "BookingPaymentMethod" AS ENUM ('CASH', 'CREDIT', 'ELECTRONIC');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentMethod" "BookingPaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'FIXED';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "hasWarranty" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "laborCostSYP" DECIMAL(12,2),
ADD COLUMN     "laborCostUSD" DECIMAL(12,2),
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "materialCostSYP" DECIMAL(12,2),
ADD COLUMN     "materialCostUSD" DECIMAL(12,2),
ADD COLUMN     "warrantyDescription" TEXT,
ADD COLUMN     "warrantyTerms" TEXT;
