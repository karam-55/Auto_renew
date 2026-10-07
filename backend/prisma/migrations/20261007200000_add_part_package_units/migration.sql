-- Package/unit conversion fields on Part (all nullable — zero impact on existing data)
ALTER TABLE "Part" ADD COLUMN "baseUnitName" TEXT;
ALTER TABLE "Part" ADD COLUMN "purchaseUnitName" TEXT;
ALTER TABLE "Part" ADD COLUMN "unitsPerPackage" INTEGER;
