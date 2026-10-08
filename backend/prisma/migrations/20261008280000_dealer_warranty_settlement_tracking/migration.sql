CREATE TYPE "DealerWarrantyEngineType" AS ENUM ('GASOLINE', 'HYBRID', 'ELECTRIC');

ALTER TABLE "DealerWarranty"
  ADD COLUMN "engineType" "DealerWarrantyEngineType",
  ADD COLUMN "customerPaidUSD" DECIMAL(12,2),
  ADD COLUMN "companyShareUSD" DECIMAL(12,2),
  ADD COLUMN "dealerShareUSD" DECIMAL(12,2);

CREATE TABLE "DealerWarrantyReceipt" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dealerWarrantyId" TEXT NOT NULL,
  "amountSYP" DECIMAL(12,2) NOT NULL,
  "amountUSD" DECIMAL(12,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "idempotencyKey" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DealerWarrantyReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DealerWarrantyReceipt_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DealerWarrantyReceipt_dealerWarrantyId_fkey"
    FOREIGN KEY ("dealerWarrantyId") REFERENCES "DealerWarranty"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DealerWarrantyReceipt_tenantId_idempotencyKey_key"
  ON "DealerWarrantyReceipt" ("tenantId", "idempotencyKey");
CREATE INDEX "DealerWarrantyReceipt_tenantId_idx" ON "DealerWarrantyReceipt" ("tenantId");
CREATE INDEX "DealerWarrantyReceipt_dealerWarrantyId_paymentDate_idx"
  ON "DealerWarrantyReceipt" ("dealerWarrantyId", "paymentDate");

WITH warranty_shares("id", "engineType", "companyShareUSD") AS (
  VALUES
    ('3913b353-3bb0-45d7-8ecc-65703e1c66db', 'HYBRID', 300.00),
    ('22bf17f5-749a-4700-990c-4071797c5f62', 'HYBRID', 300.00),
    ('382076d6-0461-4402-87b2-c876d98247f9', 'HYBRID', 300.00),
    ('be70da9f-7b7b-45f9-abda-aabb2313b8c3', 'HYBRID', 300.00),
    ('05155689-f5a4-4cd0-882c-b4ed55835efc', 'HYBRID', 300.00),
    ('39b6e1ff-6334-43e7-8363-bb6d6d81a4b1', 'HYBRID', 300.00),
    ('d3f15a98-eb54-4dba-bb41-0318cef5a25e', 'HYBRID', 300.00),
    ('17f24727-d81a-4054-be91-906ec5e99235', 'GASOLINE', 300.00),
    ('fcf5c512-79f6-449b-b5a2-413518607f82', 'ELECTRIC', 300.00),
    ('990c4f24-0ac2-4dc5-966d-939c0bc183cd', 'HYBRID', 300.00),
    ('8c08eaa2-c518-4978-8428-8dc43b9f74b5', 'ELECTRIC', 300.00),
    ('dc9c6763-c51a-404d-8e2c-18d8aad24742', 'HYBRID', 300.00),
    ('4882b07d-842a-41a2-aced-5a9ef96b7dd2', 'GASOLINE', 600.00),
    ('7812e23d-7ed8-444e-af0f-dd7d320df9db', 'HYBRID', 300.00),
    ('3c79fa28-5ec8-4dab-966b-9074dae4aaa9', 'HYBRID', 300.00),
    ('c32d4bc9-d87e-4738-a017-62e1fc4bba22', 'HYBRID', 300.00),
    ('9fafaff0-726b-4234-8a1b-6cc5ca287868', 'HYBRID', 300.00),
    ('ac9b070c-084a-4b93-8922-60b8a3c6d015', 'GASOLINE', 600.00),
    ('5acf1144-e08a-4463-8052-65c7ace6c69b', 'HYBRID', 300.00),
    ('c5783874-af65-45d1-afae-df6323ed7748', 'ELECTRIC', 300.00),
    ('6a93d29e-d7ec-4e20-bc19-ce4118acab03', 'HYBRID', 300.00),
    ('8a7ee997-73d9-4edf-9532-70737e464060', 'HYBRID', 300.00),
    ('280a21a0-86c4-4c4a-ab41-7d4552f2fe20', 'HYBRID', 300.00),
    ('37cff5ee-4251-422a-8ff0-156289e55f56', 'GASOLINE', 600.00),
    ('b9836305-5374-4f9b-86a4-b7fba8bfd3cd', 'ELECTRIC', 300.00),
    ('2f18756d-eae1-4a6e-ab43-5feb1100dc5c', 'HYBRID', 300.00),
    ('4093dedd-cb27-4d7c-a14a-7c409c7939e3', 'HYBRID', 300.00),
    ('d545c2dc-3518-4f75-a874-d7063383e206', 'HYBRID', 300.00)
)
UPDATE "DealerWarranty" AS w
SET "engineType" = s."engineType"::"DealerWarrantyEngineType",
    "customerPaidUSD" = CASE WHEN w."currency" = 'USD' THEN w."amountPaid" ELSE NULL END,
    "companyShareUSD" = s."companyShareUSD",
    "dealerShareUSD" = CASE WHEN w."currency" = 'USD' THEN w."amountPaid" - s."companyShareUSD" ELSE NULL END
FROM warranty_shares AS s
WHERE w."id" = s."id"
  AND w."deletedAt" IS NULL;
