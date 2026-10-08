-- CreateEnum
CREATE TYPE "CostCenterType" AS ENUM ('WORKSHOP', 'WAREHOUSE', 'CAR_WASH', 'RECEPTION', 'ADMIN', 'SHARED');

-- CreateEnum
CREATE TYPE "CostDriver" AS ENUM ('LABOR_HOURS', 'MATERIAL_MOVES', 'SERVICE_COUNT', 'INVOICE_COUNT', 'FIXED', 'REVENUE_ALLOCATION');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('DIRECT_LABOR', 'DIRECT_MATERIAL', 'VARIABLE_OVERHEAD', 'FIXED_OVERHEAD', 'DEPRECIATION', 'ALLOCATED_ADMIN');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION');

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "type" "CostCenterType" NOT NULL,
    "costDriver" "CostDriver" NOT NULL,
    "driverQuantity" INTEGER NOT NULL DEFAULT 1,
    "monthlyBudget" DECIMAL(12,2) NOT NULL,
    "actualCost" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenterAllocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromCenterId" TEXT NOT NULL,
    "toCenterId" TEXT NOT NULL,
    "allocationPercent" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenterAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "usefulLifeYears" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchaseCost" DECIMAL(12,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "salvageValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthlyDepreciation" DECIMAL(12,2),
    "userAdjustedDepreciation" DECIMAL(12,2),
    "accumulatedDepreciation" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCostDetail" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "costCenterId" TEXT NOT NULL,
    "costType" "CostType" NOT NULL,
    "amountSYP" DECIMAL(12,2) NOT NULL,
    "amountUSD" DECIMAL(12,2),
    "isCalculated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCostDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingJobCost" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "serviceId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "laborHours" DECIMAL(5,2),
    "laborCost" DECIMAL(12,2),
    "materialCost" DECIMAL(12,2),
    "overheadCost" DECIMAL(12,2),
    "totalCost" DECIMAL(12,2),
    "varianceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingJobCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostCenter_tenantId_idx" ON "CostCenter"("tenantId");

-- CreateIndex
CREATE INDEX "CostCenter_type_idx" ON "CostCenter"("type");

-- CreateIndex
CREATE INDEX "CostCenter_isActive_idx" ON "CostCenter"("isActive");

-- CreateIndex
CREATE INDEX "CostCenterAllocation_tenantId_idx" ON "CostCenterAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "CostCenterAllocation_fromCenterId_idx" ON "CostCenterAllocation"("fromCenterId");

-- CreateIndex
CREATE INDEX "CostCenterAllocation_toCenterId_idx" ON "CostCenterAllocation"("toCenterId");

-- CreateIndex
CREATE INDEX "AssetCategory_tenantId_idx" ON "AssetCategory"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_isActive_idx" ON "Asset"("isActive");

-- CreateIndex
CREATE INDEX "ServiceCostDetail_tenantId_idx" ON "ServiceCostDetail"("tenantId");

-- CreateIndex
CREATE INDEX "ServiceCostDetail_serviceId_idx" ON "ServiceCostDetail"("serviceId");

-- CreateIndex
CREATE INDEX "ServiceCostDetail_costCenterId_idx" ON "ServiceCostDetail"("costCenterId");

-- CreateIndex
CREATE INDEX "BookingJobCost_tenantId_idx" ON "BookingJobCost"("tenantId");

-- CreateIndex
CREATE INDEX "BookingJobCost_bookingId_idx" ON "BookingJobCost"("bookingId");

-- CreateIndex
CREATE INDEX "BookingJobCost_serviceId_idx" ON "BookingJobCost"("serviceId");

-- AddForeignKey
ALTER TABLE "CostCenterAllocation" ADD CONSTRAINT "CostCenterAllocation_fromCenterId_fkey" FOREIGN KEY ("fromCenterId") REFERENCES "CostCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenterAllocation" ADD CONSTRAINT "CostCenterAllocation_toCenterId_fkey" FOREIGN KEY ("toCenterId") REFERENCES "CostCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCostDetail" ADD CONSTRAINT "ServiceCostDetail_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCostDetail" ADD CONSTRAINT "ServiceCostDetail_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingJobCost" ADD CONSTRAINT "BookingJobCost_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
