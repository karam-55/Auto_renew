CREATE UNIQUE INDEX "JournalEntry_active_source_unique"
ON "JournalEntry" ("tenantId", "sourceType", "sourceId")
WHERE "sourceType" IS NOT NULL
  AND "sourceId" IS NOT NULL
  AND "isReversed" = false
  AND "deletedAt" IS NULL;
