-- Delete packages with old types
DELETE FROM "CharterTravelPackage" WHERE type IN ('OUTBOUND', 'DOMESTIC', 'CUSTOM');

-- Drop default so we can change the column type (PostgreSQL cannot cast default across enum change)
ALTER TABLE "CharterTravelPackage" ALTER COLUMN "type" DROP DEFAULT;

-- Alter enum: Remove old values and add new ones
-- Note: PostgreSQL doesn't support removing enum values directly, so we need to recreate the enum
CREATE TYPE "PackageType_new" AS ENUM ('CHARTER', 'INBOUND', 'REGULAR');

-- Update the column to use the new enum, converting HOTEL_CHARTER to CHARTER
ALTER TABLE "CharterTravelPackage" ALTER COLUMN "type" TYPE "PackageType_new" USING (
  CASE 
    WHEN "type"::text = 'HOTEL_CHARTER' THEN 'CHARTER'::"PackageType_new"
    WHEN "type"::text = 'INBOUND' THEN 'INBOUND'::"PackageType_new"
    ELSE 'REGULAR'::"PackageType_new"
  END
);

-- Drop the old enum
DROP TYPE "PackageType";

-- Rename the new enum to the original name
ALTER TYPE "PackageType_new" RENAME TO "PackageType";

-- Restore default
ALTER TABLE "CharterTravelPackage" ALTER COLUMN "type" SET DEFAULT 'CHARTER'::"PackageType";

