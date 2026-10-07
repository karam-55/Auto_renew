-- Allow duplicate part numbers: drop the unique index on "Part"."partNumber"
DROP INDEX IF EXISTS "Part_partNumber_key";
