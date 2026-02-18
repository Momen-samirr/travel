-- Delete packages with old types
DELETE FROM "CharterTravelPackage" WHERE type IN ('OUTBOUND', 'DOMESTIC', 'CUSTOM');

-- Alter enum: Remove old values and add new ones
-- Note: PostgreSQL doesn't support removing enum values directly, so we need to recreate the enum
-- First, create a new enum with the new values
CREATE TYPE "PackageType_new" AS ENUM ('CHARTER', 'INBOUND', 'REGULAR');

-- Drop the default constraint temporarily
ALTER TABLE "CharterTravelPackage" ALTER COLUMN "type" DROP DEFAULT;

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

-- Restore the default constraint with the new enum value
ALTER TABLE "CharterTravelPackage" ALTER COLUMN "type" SET DEFAULT 'CHARTER'::"PackageType";

