-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "numberOfChildren6to12" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "numberOfChildren2to6" INTEGER;

-- Migrate existing data (if any)
UPDATE "Booking" 
SET 
  "numberOfChildren6to12" = "numberOfChildren",
  "numberOfChildren2to6" = NULL
WHERE "numberOfChildren" IS NOT NULL AND "numberOfChildren6to12" IS NULL;

-- Drop old column
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "numberOfChildren";

