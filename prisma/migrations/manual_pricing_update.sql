-- Manual migration script for updating pricing structure
-- This script updates RoomTypePricing to use the new pricing fields

-- Step 1: Add new columns
ALTER TABLE "RoomTypePricing" 
  ADD COLUMN IF NOT EXISTS "adultPrice" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "childPrice6to12" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "childPrice2to6" DECIMAL(10,2);

-- Step 2: Migrate existing data
UPDATE "RoomTypePricing" 
SET 
  "adultPrice" = "price",
  "childPrice6to12" = "childPrice",
  "childPrice2to6" = NULL
WHERE "adultPrice" IS NULL;

-- Step 3: Make adultPrice NOT NULL (after data migration)
ALTER TABLE "RoomTypePricing" 
  ALTER COLUMN "adultPrice" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "RoomTypePricing" 
  DROP COLUMN IF EXISTS "price",
  DROP COLUMN IF EXISTS "childPrice";

