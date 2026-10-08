DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceNumber_key"
  ON "Invoice" ("tenantId", "invoiceNumber");

CREATE TABLE "InvoiceNumberSequence" (
  "tenantId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceNumberSequence_pkey" PRIMARY KEY ("tenantId", "year"),
  CONSTRAINT "InvoiceNumberSequence_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "InvoiceNumberSequence" ("tenantId", "year", "lastValue")
SELECT "tenantId",
       substring("invoiceNumber" from '([0-9]{4})-[0-9]+$')::INTEGER,
       MAX(substring("invoiceNumber" from '[0-9]{4}-([0-9]+)$')::INTEGER)
FROM "Invoice"
WHERE "invoiceNumber" ~ '[0-9]{4}-[0-9]+$'
GROUP BY "tenantId", substring("invoiceNumber" from '([0-9]{4})-[0-9]+$')::INTEGER;
