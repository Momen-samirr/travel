-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'CHARTER_PACKAGE';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "charterPackageId" TEXT;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "placeId" TEXT;

-- CreateTable
CREATE TABLE "CharterTravelPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "mainImage" TEXT,
    "gallery" JSONB NOT NULL,
    "basePrice" DECIMAL(10,2),
    "priceRangeMin" DECIMAL(10,2),
    "priceRangeMax" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "discount" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "includedServices" JSONB NOT NULL,
    "excludedServices" JSONB NOT NULL,
    "excursionProgram" JSONB NOT NULL,
    "requiredDocuments" JSONB NOT NULL,

    CONSTRAINT "CharterTravelPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharterDepartureOption" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "departureAirport" TEXT NOT NULL,
    "arrivalAirport" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "flightInfo" TEXT,
    "priceModifier" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterDepartureOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharterPackageHotelOption" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "starRating" INTEGER,
    "bookingRating" DOUBLE PRECISION,
    "distanceFromCenter" DOUBLE PRECISION,
    "singleRoomPrice" DECIMAL(10,2),
    "doubleRoomPrice" DECIMAL(10,2),
    "childPrice" DECIMAL(10,2),
    "infantPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterPackageHotelOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharterPackageAddon" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterPackageAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharterPackageReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "images" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterPackageReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharterTravelPackage_slug_key" ON "CharterTravelPackage"("slug");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_slug_idx" ON "CharterTravelPackage"("slug");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_isActive_idx" ON "CharterTravelPackage"("isActive");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_destinationCountry_destinationCity_idx" ON "CharterTravelPackage"("destinationCountry", "destinationCity");

-- CreateIndex
CREATE INDEX "CharterDepartureOption_packageId_idx" ON "CharterDepartureOption"("packageId");

-- CreateIndex
CREATE INDEX "CharterDepartureOption_departureDate_idx" ON "CharterDepartureOption"("departureDate");

-- CreateIndex
CREATE INDEX "CharterPackageHotelOption_packageId_idx" ON "CharterPackageHotelOption"("packageId");

-- CreateIndex
CREATE INDEX "CharterPackageHotelOption_hotelId_idx" ON "CharterPackageHotelOption"("hotelId");

-- CreateIndex
CREATE INDEX "CharterPackageAddon_packageId_idx" ON "CharterPackageAddon"("packageId");

-- CreateIndex
CREATE INDEX "CharterPackageReview_packageId_idx" ON "CharterPackageReview"("packageId");

-- CreateIndex
CREATE INDEX "CharterPackageReview_isApproved_idx" ON "CharterPackageReview"("isApproved");

-- CreateIndex
CREATE INDEX "CharterPackageReview_rating_idx" ON "CharterPackageReview"("rating");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_charterPackageId_fkey" FOREIGN KEY ("charterPackageId") REFERENCES "CharterTravelPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterDepartureOption" ADD CONSTRAINT "CharterDepartureOption_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CharterTravelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterPackageHotelOption" ADD CONSTRAINT "CharterPackageHotelOption_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CharterTravelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterPackageHotelOption" ADD CONSTRAINT "CharterPackageHotelOption_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterPackageAddon" ADD CONSTRAINT "CharterPackageAddon_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CharterTravelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterPackageReview" ADD CONSTRAINT "CharterPackageReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharterPackageReview" ADD CONSTRAINT "CharterPackageReview_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CharterTravelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
