-- Add Portuguese name column for products
ALTER TABLE "Product"
ADD COLUMN "namePt" TEXT NOT NULL DEFAULT '';
