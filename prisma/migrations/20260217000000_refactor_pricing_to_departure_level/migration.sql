-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD');

-- CreateTable
CREATE TABLE "DepartureHotelPricing" (
    "id" TEXT NOT NULL,
    "departureOptionId" TEXT NOT NULL,
    "hotelOptionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartureHotelPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypePricing" (
    "id" TEXT NOT NULL,
    "departureHotelPricingId" TEXT NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "childPrice" DECIMAL(10,2),
    "infantPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomTypePricing_pkey" PRIMARY KEY ("id")
);

-- Migrate data from DepartureOptionHotelOption and CharterPackageHotelOption to new structure
-- Step 1: Create DepartureHotelPricing records from DepartureOptionHotelOption
INSERT INTO "DepartureHotelPricing" ("id", "departureOptionId", "hotelOptionId", "currency", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "departureOptionId",
    "hotelOptionId",
    COALESCE((SELECT "currency" FROM "CharterPackageHotelOption" WHERE "id" = "hotelOptionId"), 'EGP'),
    "createdAt",
    "updatedAt"
FROM "DepartureOptionHotelOption";

-- Step 2: Create RoomTypePricing records for SINGLE and DOUBLE from CharterPackageHotelOption
INSERT INTO "RoomTypePricing" ("id", "departureHotelPricingId", "roomType", "price", "childPrice", "infantPrice", "currency", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    dhp."id",
    'SINGLE',
    COALESCE(ho."singleRoomPrice", 0),
    ho."childPrice",
    ho."infantPrice",
    COALESCE(ho."currency", 'EGP'),
    NOW(),
    NOW()
FROM "DepartureHotelPricing" dhp
JOIN "CharterPackageHotelOption" ho ON ho."id" = dhp."hotelOptionId"
WHERE ho."singleRoomPrice" IS NOT NULL;

INSERT INTO "RoomTypePricing" ("id", "departureHotelPricingId", "roomType", "price", "childPrice", "infantPrice", "currency", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    dhp."id",
    'DOUBLE',
    COALESCE(ho."doubleRoomPrice", 0),
    ho."childPrice",
    ho."infantPrice",
    COALESCE(ho."currency", 'EGP'),
    NOW(),
    NOW()
FROM "DepartureHotelPricing" dhp
JOIN "CharterPackageHotelOption" ho ON ho."id" = dhp."hotelOptionId"
WHERE ho."doubleRoomPrice" IS NOT NULL;

-- CreateIndex
CREATE INDEX "DepartureHotelPricing_departureOptionId_idx" ON "DepartureHotelPricing"("departureOptionId");

-- CreateIndex
CREATE INDEX "DepartureHotelPricing_hotelOptionId_idx" ON "DepartureHotelPricing"("hotelOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartureHotelPricing_departureOptionId_hotelOptionId_key" ON "DepartureHotelPricing"("departureOptionId", "hotelOptionId");

-- CreateIndex
CREATE INDEX "RoomTypePricing_departureHotelPricingId_idx" ON "RoomTypePricing"("departureHotelPricingId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomTypePricing_departureHotelPricingId_roomType_key" ON "RoomTypePricing"("departureHotelPricingId", "roomType");

-- AddForeignKey
ALTER TABLE "DepartureHotelPricing" ADD CONSTRAINT "DepartureHotelPricing_departureOptionId_fkey" FOREIGN KEY ("departureOptionId") REFERENCES "CharterDepartureOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureHotelPricing" ADD CONSTRAINT "DepartureHotelPricing_hotelOptionId_fkey" FOREIGN KEY ("hotelOptionId") REFERENCES "CharterPackageHotelOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypePricing" ADD CONSTRAINT "RoomTypePricing_departureHotelPricingId_fkey" FOREIGN KEY ("departureHotelPricingId") REFERENCES "DepartureHotelPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "DepartureOptionHotelOption" DROP CONSTRAINT IF EXISTS "DepartureOptionHotelOption_departureOptionId_fkey";
ALTER TABLE "DepartureOptionHotelOption" DROP CONSTRAINT IF EXISTS "DepartureOptionHotelOption_hotelOptionId_fkey";

-- DropTable
DROP TABLE IF EXISTS "DepartureOptionHotelOption";

-- AlterTable
ALTER TABLE "CharterDepartureOption" DROP CONSTRAINT IF EXISTS "CharterDepartureOption_availableHotels_fkey";

-- AlterTable
ALTER TABLE "CharterPackageHotelOption" DROP COLUMN IF EXISTS "singleRoomPrice",
DROP COLUMN IF EXISTS "doubleRoomPrice",
DROP COLUMN IF EXISTS "childPrice",
DROP COLUMN IF EXISTS "infantPrice",
DROP COLUMN IF EXISTS "currency";

-- AlterTable
ALTER TABLE "Hotel" DROP COLUMN IF EXISTS "pricePerNight",
DROP COLUMN IF EXISTS "currency";

