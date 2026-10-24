ALTER TABLE "Expense"
  ADD COLUMN "supplierId" TEXT,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "quantity" DECIMAL(12,3),
  ADD COLUMN "unitCostSYP" DECIMAL(12,2),
  ADD COLUMN "unitCostUSD" DECIMAL(12,2),
  ADD COLUMN "attachmentUrl" TEXT;

ALTER TABLE "GoodsReceiptNote"
  ADD COLUMN "dueDate" TIMESTAMP(3);

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Expense_supplierId_idx" ON "Expense"("supplierId");
