-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('HOTEL_CHARTER', 'INBOUND', 'OUTBOUND', 'DOMESTIC', 'CUSTOM');

-- AlterTable
ALTER TABLE "CharterTravelPackage" ADD COLUMN     "type" "PackageType" NOT NULL DEFAULT 'HOTEL_CHARTER',
ADD COLUMN     "typeConfig" JSONB;

-- CreateIndex
CREATE INDEX "CharterTravelPackage_type_idx" ON "CharterTravelPackage"("type");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_type_isActive_idx" ON "CharterTravelPackage"("type", "isActive");
