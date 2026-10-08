-- Add currency column to DealerWarranty
ALTER TABLE "DealerWarranty" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'SYP';
