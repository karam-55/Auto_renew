DO $$
BEGIN
    -- Drop existing unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Employee_tenantId_employeeCode_key'
    ) THEN
        ALTER TABLE "Employee" DROP CONSTRAINT "Employee_tenantId_employeeCode_key";
    END IF;
    
    -- Add new unique constraint with deletedAt
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Employee_tenantId_employeeCode_deletedAt_key'
    ) THEN
        ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_employeeCode_deletedAt_key" 
        UNIQUE ("tenantId", "employeeCode", "deletedAt");
    END IF;
END $$;
