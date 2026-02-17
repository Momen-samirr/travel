-- CreateIndex
CREATE INDEX "CharterTravelPackage_isActive_destinationCountry_destinatio_idx" ON "CharterTravelPackage"("isActive", "destinationCountry", "destinationCity");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_isActive_priceRangeMin_priceRangeMax_idx" ON "CharterTravelPackage"("isActive", "priceRangeMin", "priceRangeMax");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_isActive_nights_days_idx" ON "CharterTravelPackage"("isActive", "nights", "days");

-- CreateIndex
CREATE INDEX "CharterTravelPackage_isActive_type_destinationCountry_idx" ON "CharterTravelPackage"("isActive", "type", "destinationCountry");
