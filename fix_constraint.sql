ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_tenantId_employeeCode_key";
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_employeeCode_key" UNIQUE ("tenantId", "employeeCode", "deletedAt");
