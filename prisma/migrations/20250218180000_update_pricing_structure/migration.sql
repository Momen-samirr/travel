-- AlterTable
ALTER TABLE "RoomTypePricing" ADD COLUMN IF NOT EXISTS "adultPrice" DECIMAL(10,2);
ALTER TABLE "RoomTypePricing" ADD COLUMN IF NOT EXISTS "childPrice6to12" DECIMAL(10,2);
ALTER TABLE "RoomTypePricing" ADD COLUMN IF NOT EXISTS "childPrice2to6" DECIMAL(10,2);

-- Migrate existing data
UPDATE "RoomTypePricing" 
SET 
  "adultPrice" = "price",
  "childPrice6to12" = "childPrice",
  "childPrice2to6" = NULL
WHERE "adultPrice" IS NULL;

-- Make adultPrice NOT NULL
ALTER TABLE "RoomTypePricing" ALTER COLUMN "adultPrice" SET NOT NULL;

-- Drop old columns
ALTER TABLE "RoomTypePricing" DROP COLUMN IF EXISTS "price";
ALTER TABLE "RoomTypePricing" DROP COLUMN IF EXISTS "childPrice";

