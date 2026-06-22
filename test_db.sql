SELECT count(*) FROM "Dealer";
SELECT id, name, phone FROM "Dealer" WHERE "deletedAt" IS NULL LIMIT 3;
