CREATE TYPE "PriceSource" AS ENUM ('BASE', 'FX', 'OVERRIDE');

ALTER TABLE "Booking"
ADD COLUMN "quoteSourceAmount" DECIMAL(10,2),
ADD COLUMN "quoteSourceCurrency" TEXT,
ADD COLUMN "quotePreferredCurrency" TEXT,
ADD COLUMN "quoteFxRate" DECIMAL(14,6),
ADD COLUMN "quotePriceSource" "PriceSource",
ADD COLUMN "quoteSubtotalAmount" DECIMAL(10,2),
ADD COLUMN "quoteAddonsAmount" DECIMAL(10,2),
ADD COLUMN "quoteDiscountAmount" DECIMAL(10,2);

CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DECIMAL(14,6) NOT NULL,
    "source" TEXT DEFAULT 'MANUAL',
    "validAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CharterPackagePriceOverride" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2),
    "priceRangeMin" DECIMAL(10,2),
    "priceRangeMax" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterPackagePriceOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TourPriceOverride" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "discountPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPriceOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_key" ON "ExchangeRate"("fromCurrency", "toCurrency");
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_idx" ON "ExchangeRate"("fromCurrency", "toCurrency");

CREATE UNIQUE INDEX "CharterPackagePriceOverride_packageId_currency_key" ON "CharterPackagePriceOverride"("packageId", "currency");
CREATE INDEX "CharterPackagePriceOverride_currency_idx" ON "CharterPackagePriceOverride"("currency");

CREATE UNIQUE INDEX "TourPriceOverride_tourId_currency_key" ON "TourPriceOverride"("tourId", "currency");
CREATE INDEX "TourPriceOverride_currency_idx" ON "TourPriceOverride"("currency");

ALTER TABLE "CharterPackagePriceOverride"
ADD CONSTRAINT "CharterPackagePriceOverride_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "CharterTravelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TourPriceOverride"
ADD CONSTRAINT "TourPriceOverride_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
