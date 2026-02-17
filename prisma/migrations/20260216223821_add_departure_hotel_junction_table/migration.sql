-- CreateTable
CREATE TABLE "DepartureOptionHotelOption" (
    "id" TEXT NOT NULL,
    "departureOptionId" TEXT NOT NULL,
    "hotelOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartureOptionHotelOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartureOptionHotelOption_departureOptionId_idx" ON "DepartureOptionHotelOption"("departureOptionId");

-- CreateIndex
CREATE INDEX "DepartureOptionHotelOption_hotelOptionId_idx" ON "DepartureOptionHotelOption"("hotelOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepartureOptionHotelOption_departureOptionId_hotelOptionId_key" ON "DepartureOptionHotelOption"("departureOptionId", "hotelOptionId");

-- AddForeignKey
ALTER TABLE "DepartureOptionHotelOption" ADD CONSTRAINT "DepartureOptionHotelOption_departureOptionId_fkey" FOREIGN KEY ("departureOptionId") REFERENCES "CharterDepartureOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartureOptionHotelOption" ADD CONSTRAINT "DepartureOptionHotelOption_hotelOptionId_fkey" FOREIGN KEY ("hotelOptionId") REFERENCES "CharterPackageHotelOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
