-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TechnicianSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "bookingId" TEXT,
    "serviceId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechnicianSchedule_tenantId_idx" ON "TechnicianSchedule"("tenantId");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_technicianId_idx" ON "TechnicianSchedule"("technicianId");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_bookingId_idx" ON "TechnicianSchedule"("bookingId");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_serviceId_idx" ON "TechnicianSchedule"("serviceId");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_status_idx" ON "TechnicianSchedule"("status");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_startTime_idx" ON "TechnicianSchedule"("startTime");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_endTime_idx" ON "TechnicianSchedule"("endTime");

-- CreateIndex
CREATE INDEX "TechnicianSchedule_technicianId_startTime_endTime_idx" ON "TechnicianSchedule"("technicianId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "TechnicianSchedule" ADD CONSTRAINT "TechnicianSchedule_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSchedule" ADD CONSTRAINT "TechnicianSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSchedule" ADD CONSTRAINT "TechnicianSchedule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianSchedule" ADD CONSTRAINT "TechnicianSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
