CREATE TABLE "GoodsReceiptNoteNumberSequence" (
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoodsReceiptNoteNumberSequence_pkey" PRIMARY KEY ("year")
);

INSERT INTO "GoodsReceiptNoteNumberSequence" ("year", "lastValue")
SELECT substring("grnNumber" from 'GRN-([0-9]{4})-[0-9]+$')::INTEGER,
       MAX(substring("grnNumber" from 'GRN-[0-9]{4}-([0-9]+)$')::INTEGER)
FROM "GoodsReceiptNote"
WHERE "grnNumber" ~ '^GRN-[0-9]{4}-[0-9]+$'
GROUP BY substring("grnNumber" from 'GRN-([0-9]{4})-[0-9]+$')::INTEGER;
