-- Rename ABV column to VOL and add base columns sourced from existing JSON details
ALTER TABLE "Product" RENAME COLUMN "abv" TO "vol";

ALTER TABLE "Product"
  ADD COLUMN "baseEn" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Product"
  ADD COLUMN "basePt" TEXT NOT NULL DEFAULT '';

-- Attempt to backfill base strings from existing JSON details if available
UPDATE "Product"
SET
  "baseEn" = COALESCE("details"::jsonb -> 'base' ->> 'en', ''),
  "basePt" = COALESCE("details"::jsonb -> 'base' ->> 'pt', '');

ALTER TABLE "Order"
  ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order"
  ALTER COLUMN "userId" DROP NOT NULL;
