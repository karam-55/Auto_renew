CREATE TABLE "PurchaseOrderNumberSequence" (
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderNumberSequence_pkey" PRIMARY KEY ("year")
);

INSERT INTO "PurchaseOrderNumberSequence" ("year", "lastValue")
SELECT substring("orderNumber" from 'PO-([0-9]{4})-[0-9]+$')::INTEGER,
       MAX(substring("orderNumber" from 'PO-[0-9]{4}-([0-9]+)$')::INTEGER)
FROM "PurchaseOrder"
WHERE "orderNumber" ~ '^PO-[0-9]{4}-[0-9]+$'
GROUP BY substring("orderNumber" from 'PO-([0-9]{4})-[0-9]+$')::INTEGER;
