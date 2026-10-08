-- CreateEnum
CREATE TYPE "VehicleHistoryType" AS ENUM ('SERVICE', 'PART_CONSUMPTION', 'FAULT', 'NOTE');

-- CreateEnum
CREATE TYPE "FaultSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FaultStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'DONE');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "lastServiceDate" TIMESTAMP(3),
ADD COLUMN     "nextServiceDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VehicleHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "serviceId" TEXT,
    "technicianId" TEXT,
    "description" TEXT NOT NULL,
    "type" "VehicleHistoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleFault" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FaultSeverity" NOT NULL,
    "status" "FaultStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleFault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAttachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueMileage" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleHistory_tenantId_idx" ON "VehicleHistory"("tenantId");

-- CreateIndex
CREATE INDEX "VehicleHistory_vehicleId_idx" ON "VehicleHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleHistory_type_idx" ON "VehicleHistory"("type");

-- CreateIndex
CREATE INDEX "VehicleHistory_createdAt_idx" ON "VehicleHistory"("createdAt");

-- CreateIndex
CREATE INDEX "VehicleFault_tenantId_idx" ON "VehicleFault"("tenantId");

-- CreateIndex
CREATE INDEX "VehicleFault_vehicleId_idx" ON "VehicleFault"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleFault_status_idx" ON "VehicleFault"("status");

-- CreateIndex
CREATE INDEX "VehicleFault_severity_idx" ON "VehicleFault"("severity");

-- CreateIndex
CREATE INDEX "VehicleAttachment_tenantId_idx" ON "VehicleAttachment"("tenantId");

-- CreateIndex
CREATE INDEX "VehicleAttachment_vehicleId_idx" ON "VehicleAttachment"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleAttachment_type_idx" ON "VehicleAttachment"("type");

-- CreateIndex
CREATE INDEX "VehicleRecommendation_tenantId_idx" ON "VehicleRecommendation"("tenantId");

-- CreateIndex
CREATE INDEX "VehicleRecommendation_vehicleId_idx" ON "VehicleRecommendation"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleRecommendation_status_idx" ON "VehicleRecommendation"("status");

-- CreateIndex
CREATE INDEX "VehicleRecommendation_dueDate_idx" ON "VehicleRecommendation"("dueDate");

-- AddForeignKey
ALTER TABLE "VehicleHistory" ADD CONSTRAINT "VehicleHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleFault" ADD CONSTRAINT "VehicleFault_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAttachment" ADD CONSTRAINT "VehicleAttachment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRecommendation" ADD CONSTRAINT "VehicleRecommendation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
