-- AddDepartmentSalaryAndServiceDepartmentRelation

-- Add department salary fields
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "hasFixedSalary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "fixedMonthlySalarySYP" DECIMAL(12, 2);
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "fixedMonthlySalaryUSD" DECIMAL(12, 2);
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "workHoursPerMonth" INTEGER DEFAULT 160;
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "calculatedHourlyRateSYP" DECIMAL(12, 2);

-- Add department relation to Service
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "assignedEmployeeId" TEXT;

-- Create index for departmentId on Service
CREATE INDEX IF NOT EXISTS "Service_departmentId_idx" ON "Service"("departmentId");
