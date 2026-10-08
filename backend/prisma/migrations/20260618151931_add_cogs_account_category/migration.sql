-- ============================================
-- ADD COGS TO AccountType & ADD AccountCategory
-- ============================================

-- Step 1: Create new AccountType enum with COGS
CREATE TYPE "AccountType_new" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'COGS', 'EXPENSE');

-- Step 2: Convert Account.accountType to new enum
ALTER TABLE "Account" ALTER COLUMN "accountType" DROP DEFAULT;
ALTER TABLE "Account" ALTER COLUMN "accountType" TYPE "AccountType_new" USING ("accountType"::text)::"AccountType_new";

-- Step 3: Drop old enum and rename new one
DROP TYPE "AccountType";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";

-- Step 4: Create AccountCategory enum (GAAP standard categories)
CREATE TYPE "AccountCategory" AS ENUM (
  'CURRENT_ASSET',
  'FIXED_ASSET',
  'INTANGIBLE_ASSET',
  'CONTRA_ASSET',
  'CURRENT_LIABILITY',
  'LONG_TERM_LIABILITY',
  'EQUITY',
  'RETAINED_EARNINGS',
  'REVENUE',
  'CONTRA_REVENUE',
  'OTHER_INCOME',
  'COGS',
  'OPERATING_EXPENSE',
  'NON_OPERATING_EXPENSE',
  'TAX_EXPENSE'
);

-- Step 5: Add category and isContra columns to Account
ALTER TABLE "Account" ADD COLUMN "category" "AccountCategory";
ALTER TABLE "Account" ADD COLUMN "isContra" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Account" ALTER COLUMN "isContra" DROP DEFAULT;