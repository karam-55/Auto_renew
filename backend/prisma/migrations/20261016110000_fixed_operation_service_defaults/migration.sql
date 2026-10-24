UPDATE "Service"
SET "serviceType" = 'FIXED'
WHERE "code" IN ('MECH-001', 'MECH-002', 'MECH-009', 'MECH-010')
  AND "serviceType" = 'STANDARD'
  AND "deletedAt" IS NULL;
