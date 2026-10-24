-- Allow fractional package conversions (e.g. 4.5-litre oil bottle, 750 ml = 0.75 L).
ALTER TABLE "Part"
ALTER COLUMN "unitsPerPackage" TYPE DECIMAL(12, 3);
