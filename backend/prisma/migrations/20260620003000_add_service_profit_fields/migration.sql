-- AddServiceProfitFields
DO $$ BEGIN
    -- Add profitType column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Service' AND column_name = 'profitType'
    ) THEN
        ALTER TABLE "Service" ADD COLUMN "profitType" TEXT DEFAULT 'percentage';
    END IF;

    -- Add profitMargin column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Service' AND column_name = 'profitMargin'
    ) THEN
        ALTER TABLE "Service" ADD COLUMN "profitMargin" DECIMAL(5,2);
    END IF;

    -- Drop overheadRate column (removed from pricing model)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Service' AND column_name = 'overheadRate'
    ) THEN
        ALTER TABLE "Service" DROP COLUMN "overheadRate";
    END IF;
END $$;
